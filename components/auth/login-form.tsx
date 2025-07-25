"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, LogIn } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

// Remplacer LogistixPRO par Logistix et moderniser le formulaire
export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
    general?: string
  }>({})
  const router = useRouter()
  const { toast } = useToast()

  // Effet pour rediriger après un login réussi
  useEffect(() => {
    if (loginSuccess) {
      // Attendre un court instant pour que le cookie soit défini
      const timer = setTimeout(() => {
        window.location.href = "/dashboard"
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [loginSuccess])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const formElement = event.currentTarget
      const username = formElement.username.value
      const password = formElement.password.value

      console.log("Tentative de connexion avec:", {
        username,
        password: password ? "***" : "non défini",
      })

      // Utiliser fetch pour appeler l'API de connexion
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: username, password }),
      })

      const result = await response.json()
      console.log("Résultat de la connexion:", result)

      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté à votre compte.",
        })

        // Marquer le login comme réussi pour déclencher la redirection
        setLoginSuccess(true)
      } else {
        // Afficher les erreurs spécifiques aux champs
        if (result.field === "username") {
          setErrors({ username: result.message })
        } else if (result.field === "password") {
          setErrors({ password: result.message })
        } else {
          setErrors({ general: result.message || "Une erreur est survenue lors de la connexion" })
        }

        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: result.message || "Identifiants incorrects",
        })
      }
    } catch (error: any) {
      console.error("Erreur complète lors de la connexion:", error)
      setErrors({ general: "Une erreur inattendue s'est produite" })
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Une erreur inattendue s'est produite",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-md shadow-lg border-opacity-50">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte Logistix</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errors.general && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">{errors.general}</div>
            )}
            <motion.div
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <label htmlFor="username" className="block text-sm font-medium">
                Nom d'utilisateur
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Nom d'utilisateur"
                required
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && <p className="text-destructive text-sm mt-1">{errors.username}</p>}
            </motion.div>
            <motion.div
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <label htmlFor="password" className="block text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </motion.div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}

