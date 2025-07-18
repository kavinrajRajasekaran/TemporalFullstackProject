import express, { Request, Response } from 'express';
import userRoutes from './Routes/UserRoutes'
import OrganizationRouter from './Routes/Organizationroutes'
const app = express();
import { connectToMongo } from './config/db';
app.use(express.json());
connectToMongo()

app.get('/health', async (req: Request, res: Response) => {
  res.send(200).json({ "status": "ok" })
})



app.use('/api/organizations', OrganizationRouter)
app.use('/api/users', userRoutes)


app.listen(3000, () => {
  console.log('app listening on the port 3000');
});

