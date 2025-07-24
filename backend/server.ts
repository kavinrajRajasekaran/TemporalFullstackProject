import express, { Request, Response } from 'express';
import userRoutes from './Routes/UserRoutes'
import OrganizationRouter from './Routes/Organizationroutes'
const app = express();
const DB_URI =process.env.DB_URI!
import { connectToMongo } from './config/db';
app.use(express.json());
connectToMongo(DB_URI)

app.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({ "status": "ok" })
})

app.use('/api/organizations', OrganizationRouter)
app.use('/api/users', userRoutes)

if (require.main === module) {
  app.listen(3000, () => {
    console.log('app listening on the port 3000');
  });
}

export default app;

