import { prisma } from "../db/prisma.js";

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function create({ name, lastname, email, password }) {
  return prisma.user.create({ data: { name, lastname, email, password } });
}

export { findByEmail, create };
