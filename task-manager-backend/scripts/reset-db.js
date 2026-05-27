import 'dotenv/config';
import { prisma } from '../src/db/prisma.js';

async function reset() {
  const tasks = await prisma.task.deleteMany();
  const users = await prisma.user.deleteMany();
  console.log(`Eliminadas: ${tasks.count} tareas, ${users.count} usuarios.`);
  await prisma.$disconnect();
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
