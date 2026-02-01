"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { Globe, Loader2, Lock, Tv, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  dns: z.string().min(1, "DNS é obrigatório").url("Insira uma URL válida (ex: http://servidor.com:80)"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export function LoginForm() {
  const router = useRouter()
  const setCredentials = useAuthStore((state) => state.setCredentials)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dns: "",
      username: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Here we could validate against the API before redirecting, 
      // but for Xtream usually we just save and try to load content.
      // We'll simulate a check or just save.
      
      // Clean trailing slash from DNS
      const cleanDns = values.dns.replace(/\/$/, "")
      
      setCredentials(cleanDns, values.username, values.password)
      
      // Add a small artificial delay for UX (so user sees loading state)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-0 bg-black/40 backdrop-blur-xl shadow-2xl text-white ring-1 ring-white/10">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/20 rounded-full ring-1 ring-primary/50">
                <Tv className="w-8 h-8 text-primary" />
            </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">NEXUS IPTV</CardTitle>
        <CardDescription className="text-zinc-400">
          Entre com suas credenciais Xtream Codes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Servidor DNS</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="http://url-do-servidor.com:8080" 
                            className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary" 
                            {...field} 
                        />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Usuário</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input 
                            placeholder="Seu usuário" 
                            className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary" 
                            {...field} 
                        />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Senha</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input 
                            type="password" 
                            placeholder="••••••" 
                            className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary" 
                            {...field} 
                        />
                     </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300"
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-zinc-500">
        Desenvolvido para alta performance
      </CardFooter>
    </Card>
  )
}
