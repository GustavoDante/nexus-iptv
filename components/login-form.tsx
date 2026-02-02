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
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Clean trailing slash from DNS
      let cleanDns = values.dns.replace(/\/$/, "")
      
      console.log('[Login] Original DNS:', cleanDns)
      
      // Tentar conectar
      let testUrl = `${cleanDns}/player_api.php?username=${values.username}&password=${values.password}&action=get_live_categories`
      
      console.log('[Login] Testing connection to:', testUrl.replace(values.password, '***'))
      
      let response = await fetch(testUrl, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Nexus-IPTV/1.0',
        },
      })
      
      console.log('[Login] Response status:', response.status, response.statusText)
      
      // Se 404 e está usando HTTP, tentar HTTPS automaticamente
      if (response.status === 404 && cleanDns.startsWith('http://')) {
        console.log('[Login] Got 404 with HTTP, trying HTTPS automatically...')
        
        const httpsUrl = cleanDns.replace('http://', 'https://')
        testUrl = `${httpsUrl}/player_api.php?username=${values.username}&password=${values.password}&action=get_live_categories`
        
        console.log('[Login] Retrying with HTTPS:', testUrl.replace(values.password, '***'))
        
        response = await fetch(testUrl, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'Nexus-IPTV/1.0',
          },
        })
        
        console.log('[Login] HTTPS response status:', response.status, response.statusText)
        
        // Se funcionou com HTTPS, atualizar o DNS
        if (response.ok) {
          console.log('[Login] ✅ HTTPS worked! Updating DNS to use HTTPS')
          cleanDns = httpsUrl
          setSuccessMessage('✅ Servidor detectado com HTTPS! URL corrigida automaticamente.')
        }
      }
      
      if (!response.ok) {
        // Erros específicos por status code
        if (response.status === 404) {
          throw new Error(
            `Servidor não encontrado (404).\n\n` +
            `Verifique:\n` +
            `• URL correta incluindo protocolo (http:// ou https://)\n` +
            `• Porta se necessário (ex: :8080, :25461)\n` +
            `• Servidor está online\n\n` +
            `Testado: ${testUrl.replace(values.password, '***')}`
          )
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Usuário ou senha incorretos')
        } else {
          throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`)
        }
      }
      
      console.log('[Login] Connection successful!')
      
      console.log('[Login] Connection successful!')
      
      // Tentar parsear a resposta
      const data = await response.json()
      
      if (!Array.isArray(data) && data.user_info?.auth === 0) {
        throw new Error('Credenciais inválidas')
      }
      
      console.log('[Login] ✅ Validation passed! Saving credentials with DNS:', cleanDns)
      
      // Tudo OK, salvar credenciais (com protocolo correto)
      setCredentials(cleanDns, values.username, values.password)
      router.push("/dashboard")
      
    } catch (error) {
      console.error('Login error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          setError('Tempo esgotado. O servidor demorou muito para responder.')
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('Erro de conexão. Verifique se o DNS está correto e acessível.')
        } else {
          setError(error.message)
        }
      } else {
        setError('Erro desconhecido ao conectar')
      }
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
                            placeholder="http://servidor.com:8080" 
                            className="pl-9 bg-black/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary" 
                            {...field} 
                        />
                    </div>
                  </FormControl>
                  <p className="text-xs text-zinc-500 mt-1">
                    ⚠️ Inclua a porta se necessário (ex: :8080, :80, :25461)
                  </p>
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
            {successMessage && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm whitespace-pre-line">
                {error}
              </div>
            )}
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
      <CardFooter className="flex flex-col gap-2 text-xs text-zinc-500">
        <p className="text-center">Desenvolvido para alta performance</p>
        <p className="text-center text-zinc-600">
          A conexão será testada antes de salvar as credenciais
        </p>
      </CardFooter>
    </Card>
  )
}
