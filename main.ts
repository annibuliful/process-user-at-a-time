import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const app = express();
const port = 3030;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LOCK_PATH = '/one-user-at-time';
app.post<any, any, { message: string }, { userId: string }>(
  LOCK_PATH,
  async (req, res) => {
    const userId = req.body.userId;

    if (!userId) {
      res.send({ message: 'Invalid user' });
      return;
    }

    const lock = await prisma.lock.findFirst({
      where: {
        path: LOCK_PATH,
      },
    });

    if (lock) {
      res.send({
        message: `user: ${lock.userId} is processing this route`,
      });
      return;
    }

    const userWithLockPath = {
      userId,
      path: LOCK_PATH,
    };

    await prisma.lock.create({
      data: userWithLockPath,
    });

    // delay 5 seconds
    await delay(5000);

    // clear lock after finish 5 seconds
    await prisma.lock.delete({
      where: {
        path: userWithLockPath.path,
      },
    });

    res.send({ message: 'Finish task' });
  }
);

app.get('/', (req, res) => {
  res.send('Express + TypeScript Server');
});

app.listen(port, () => {
  console.log(
    `[server]: Server is running at http://localhost:${port}`
  );
});
