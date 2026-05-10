"use client"

import { useState, type ComponentProps } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"
import { cn } from "@trace/ui/lib/utils"

import { GithubIcon, GoogleIcon } from "@/components/icons"
import { TraceLogo } from "@trace/ui/components/logo"
import { Button } from "@trace/ui/components/button"
import { toast } from "@trace/ui/components/sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@trace/ui/components/card"
import { Input } from "@trace/ui/components/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@trace/ui/components/field"
import { Separator } from "@trace/ui/components/separator"

import { signIn, signUp } from "@/actions/auth"
import { authClient } from "@/lib/auth-client"
import { AuthMode } from "@/lib/auth-mode"
import { ServerResponseType } from "@/types/server"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })

type LoginValues = z.infer<typeof loginSchema>
type SignupValues = z.infer<typeof signupSchema>

function PasswordInputWithToggle(
  props: Omit<ComponentProps<typeof Input>, "type">
) {
  const [visible, setVisible] = useState(false)
  const { className, ...rest } = props

  return (
    <div className="relative isolate">
      <Input
        {...rest}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        className={cn(
          "absolute inset-y-px right-px z-10 flex w-9 cursor-pointer items-center justify-center rounded-md",
          "text-muted-foreground transition-colors outline-none",
          "hover:bg-muted/70 hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
        )}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOffIcon className="size-4 shrink-0" aria-hidden />
        ) : (
          <EyeIcon className="size-4 shrink-0" aria-hidden />
        )}
      </button>
    </div>
  )
}

function BrandLogo() {
  return (
    <div className="inline-flex items-center">
      <TraceLogo
        variant="brand"
        size={40}
        showText={false}
        className="h-5 w-5"
        aria-label="Trace logo"
      />
    </div>
  )
}

function SocialDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <Separator className="flex-1" />
      <span>Or use</span>
      <Separator className="flex-1" />
    </div>
  )
}

function SocialButtons({ authFlow }: { authFlow: "login" | "signup" }) {
  const [pending, setPending] = useState<"google" | "github" | null>(null)

  const errorCallbackURL = authFlow === "login" ? "/login" : "/signup"

  async function handleSocial(provider: "google" | "github") {
    try {
      setPending(provider)
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard/overview",
        errorCallbackURL,
      })

      if (result.error) {
        toast.error(
          result.error.message ?? "Could not continue with this provider."
        )
        return
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant="outline"
        type="button"
        disabled={pending !== null}
        onClick={() => void handleSocial("google")}
      >
        {pending === "google" && (
          <Loader2Icon className="size-4 animate-spin" />
        )}
        {pending !== "google" && <GoogleIcon className="size-4" />}
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        disabled={pending !== null}
        onClick={() => void handleSocial("github")}
      >
        {pending === "github" && (
          <Loader2Icon className="size-4 animate-spin" />
        )}
        {pending !== "github" && <GithubIcon className="size-4" />}
        GitHub
      </Button>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginValues) {
    try {
      const result = await signIn({
        email: values.email.trim(),
        password: values.password,
      })

      if (result.status === ServerResponseType.ERROR) {
        toast.error(result.errorMessage ?? "Could not sign you in.")
        return
      }

      router.replace("/dashboard/overview")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <PasswordInputWithToggle
                {...field}
                id={field.name}
                placeholder="Your password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2Icon className="animate-spin" />
        )}
        Sign in
      </Button>

      <SocialDivider />
      <SocialButtons authFlow="login" />
    </form>
  )
}

function SignupForm() {
  const router = useRouter()
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: SignupValues) {
    console.log("onSubmit", values)
    try {
      const result = await signUp({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      if (result.status === ServerResponseType.ERROR) {
        toast.error(result.errorMessage ?? "Could not create your account.")
        return
      }

      router.replace("/dashboard/overview")
      router.refresh()
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Your full name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <PasswordInputWithToggle
                {...field}
                id={field.name}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
              <PasswordInputWithToggle
                {...field}
                id={field.name}
                placeholder="Same as above"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2Icon className="animate-spin" />
        )}
        Create account & continue
      </Button>

      <SocialDivider />
      <SocialButtons authFlow="signup" />
    </form>
  )
}

export function AuthFormCard({ mode }: { mode: AuthMode }) {
  const isLogin = mode === AuthMode.Login

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-primary/15 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <CardTitle>
            {isLogin ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to open your dashboard—projects, stored reasoning, and how agents connect via MCP."
              : "Join trace to give your coding agents long-term memory: intent, tradeoffs, and architecture context they can retrieve later."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLogin ? <LoginForm /> : <SignupForm />}

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "New to trace? " : "Already using trace? "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Git remembers what changed. trace remembers why.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
