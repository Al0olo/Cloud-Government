import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  UserPayload 
} from '../types';

export class AuthController {
  async register(
    req: Request<{}, {}, RegisterRequest>,
    res: Response<AuthResponse>
  ) {
    const { email, password, firstName, lastName, phone } = req.body;

    try {
      // Check if user exists
      const userExists = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userExists.rows.length) {
        return res.status(400).json({ 
          message: 'User already exists'
        } as any);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (
          email, 
          password_hash, 
          first_name, 
          last_name, 
          phone, 
          role, 
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, first_name, last_name, role`,
        [email, passwordHash, firstName, lastName, phone, 'citizen', 'active']
      );

      const user = result.rows[0];

      // Generate token
      const payload: UserPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ 
        message: 'Server error during registration'
      } as any);
    }
  }

  async login(
    req: Request<{}, {}, LoginRequest>,
    res: Response<AuthResponse>
  ) {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );
      
      if (!result.rows.length) {
        return res.status(401).json({ 
          message: 'Invalid credentials'
        } as any);
      }

      const user = result.rows[0];

      const validPassword = await bcrypt.compare(
        password,
        user.password_hash
      );
      console.log(validPassword)

      if (!validPassword) {
        return res.status(401).json({ 
          message: 'Invalid credentials'
        } as any);
      }

      const payload: UserPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        message: 'Server error during login'
      } as any);
    }
  }
}