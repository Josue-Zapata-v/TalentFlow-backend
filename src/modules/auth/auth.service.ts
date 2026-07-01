import { User } from "@prisma/client";
import { ConflictError, UnauthorizedError } from "../../shared/errors";
import { comparePassword, hashPassword } from "../../shared/utils/bcrypt.util";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/utils/jwt.util";
import { usersService, UsersService } from "../users/users.service";
import { toPublicUser } from "../users/users.types";
import { LoginInput, RegisterInput } from "./auth.dto";
import { AuthResult } from "./auth.types";

export class AuthService {
  constructor(private readonly userSvc: UsersService = usersService) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userSvc.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Ya existe una cuenta con este email");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userSvc.createUser({
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      rol: input.rol,
    });

    return this.buildAuthResult(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.userSvc.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Refresh token inválido o expirado");
    }

    const user = await this.userSvc.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("Refresh token inválido o expirado");
    }

    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: User): AuthResult {
    const jwtPayload = { sub: user.id, role: user.rol };
    return {
      user: toPublicUser(user),
      accessToken: signAccessToken(jwtPayload),
      refreshToken: signRefreshToken(jwtPayload),
    };
  }
}

export const authService = new AuthService();
