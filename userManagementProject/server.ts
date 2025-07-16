import express, { Request, Response } from 'express';
import router from './router'

const app = express();
import { connectToMongo } from './config/db';
app.use(express.json());
connectToMongo()

app.get('/health', async (req: Request, res: Response) => {
  res.send(200).json({ "status": "ok" })
})


app.use('/api', router)


app.listen(3000, () => {
  console.log('app listening on the port 3000');
});

