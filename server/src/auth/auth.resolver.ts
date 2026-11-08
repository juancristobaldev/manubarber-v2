import { Args, Context, Field, ObjectType, Mutation, Resolver } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
@ObjectType() class AuthUser { @Field() id!: string; @Field() email!: string; @Field() displayName!: string; @Field() role!: string; }
@ObjectType() class AuthPayload { @Field() accessToken!: string; @Field(() => AuthUser) user!: AuthUser; }
@Resolver() export class AuthResolver {
  constructor(private auth: AuthService) {}
  @Mutation(() => AuthPayload) async adminLogin(@Args('email') email: string, @Args('password') password: string) { return this.auth.login(email, password); }
}
