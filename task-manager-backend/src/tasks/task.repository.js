import { prisma } from "../db/prisma.js";

async function findByUserId(userId) {
  return prisma.task.findMany({ where: { userId } });
}

async function findById(id, userId) {
  return prisma.task.findFirst({ where: { id, userId } });
}

async function create({ title, description, userId }) {
  return prisma.task.create({ data: { title, description, userId } });
}

async function update(id, { title, description, done }) {
  return prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(done !== undefined && { done }),
    },
  });
}

async function remove(id) {
  await prisma.task.delete({ where: { id } });
  return true;
}

export { findByUserId, findById, create, update, remove };
