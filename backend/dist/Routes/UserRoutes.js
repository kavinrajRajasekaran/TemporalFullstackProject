"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const UserController_1 = require("../controllers/UserController");
//Route for deleting the user
router.delete('/:id', UserController_1.deleteUserController);
//Route for creating the user
router.post('/', UserController_1.createUserController);
//Route for updating the user
router.patch("/:id", UserController_1.UpdateUserController);
//route for get all the users
router.get('/', UserController_1.getAllUserController);
exports.default = router;
