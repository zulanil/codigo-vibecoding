import { prisma } from "../db/prisma.js";

async function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "Token requerido" });

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  try {
    const { id } = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(401).json({ message: "Token inválido" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido" });
  }
}

export default auth;
