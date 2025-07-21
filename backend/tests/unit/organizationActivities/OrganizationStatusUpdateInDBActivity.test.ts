import { OrganizationStatusUpdateInDBActivity } from "../../../temporal/activities/OrganizationActivities";
import { ApplicationFailure } from "@temporalio/activity";
import { OrganizationModel } from "../../../models/OrganizationModel";
import { AppError } from "../../../Errors/AppError";
import mongoose from "mongoose";
import { OrganizationStatusUpdateInDBActivityInput } from "../../../utils/shared";
jest.mock("../../../models/OrganizationModel");

const mockedOrgModel = OrganizationModel as jest.Mocked<typeof OrganizationModel>;

describe("OrganizationStatusUpdateInDBActivity", () => {
  const input:OrganizationStatusUpdateInDBActivityInput = {
    id: new mongoose.Types.ObjectId(),
    status: "deleting",
    failureReason: "Some reason",
    authid: "auth0-org-id",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update organization fields and return updated document", async () => {
    const mockOrg = {
      _id: input.id,
      status: "active",
      metadata: { failureReason: "" },
      authid: "",
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockedOrgModel.findById = jest.fn().mockResolvedValue(mockOrg as any);

    const result = await OrganizationStatusUpdateInDBActivity(input)

    expect(result).toBeDefined();
    expect(mockOrg.status).toBe(input.status);
    expect(mockOrg.metadata.failureReason).toBe(input.failureReason);
    expect(mockOrg.authid).toBe(input.authid);
    expect(mockOrg.save).toHaveBeenCalled();
  });

  it("should throw ApplicationFailure if organization not found", async () => {
    mockedOrgModel.findById = jest.fn().mockResolvedValue(null);

    try {
      await OrganizationStatusUpdateInDBActivity(input);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(true);
      expect(err.message).toMatch(/status updation in the DB activity failed/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(404);
      expect(details.errorData.message).toBe("organization not found");
    }
  });

  it("should throw ApplicationFailure if unknown error occurs", async () => {
    mockedOrgModel.findById = jest.fn().mockRejectedValue(new Error("DB failure"));

    try {
      await OrganizationStatusUpdateInDBActivity(input);
      fail('Expected ApplicationFailure to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApplicationFailure);
      expect(err.nonRetryable).toBe(false);
      expect(err.message).toMatch(/status updation in the DB activity failed/);
      const details = JSON.parse(err.details[0]);
      expect(details.statusCode).toBe(500);
    }
  });
});
