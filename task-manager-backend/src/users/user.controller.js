import bcrypt from "bcryptjs";
import * as repo from "./user.repository.js";

async function register(req, res) {
  try {
    const { name, lastname, email, password } = req.body;

    const existing = await repo.findByEmail(email);
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await repo.create({ name, lastname, email, password: hashed });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await repo.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString("base64");

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
}

export { register, login };
