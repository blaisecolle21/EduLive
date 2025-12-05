<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-teal-900 to-emerald-800 bg-[url('/src/images.jpg')] bg-no-repeat bg-cover bg-center relative overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-teal-900/50 to-emerald-800/60"></div>
    
    <!-- Floating shapes for visual interest -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-blob"></div>
    <div class="absolute top-40 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-20 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
    
    <!-- Main Container -->
    <div class="relative z-10 w-full max-w-6xl mx-4 flex items-center justify-between gap-12">
      
      <!-- Left Section - Branding & Info -->
      <div class="hidden lg:flex flex-col space-y-6 text-white flex-1">
        <div class="space-y-4">
          <!-- Logo/Icon -->
          <div class="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          
          <h1 class="text-5xl font-bold leading-tight">
            Gestion de<br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Cahier de Texte
            </span>
          </h1>
          
          <p class="text-lg text-indigo-200 leading-relaxed max-w-md">
            Plateforme de gestion du cahier de texte pour un suivi pédagogique efficace.
          </p>
        </div>
        
        <!-- Features List -->
        <div class="space-y-4 pt-6">
          <div class="flex items-center space-x-3 group">
            <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-indigo-100">Suivi en temps réel des activités</span>
          </div>
          
          <div class="flex items-center space-x-3 group">
            <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg class="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-indigo-100">Progression automatiquement visible</span>
          </div>
          
          <div class="flex items-center space-x-3 group">
            <div class="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-indigo-100">Notifications instantanées</span>
          </div>
        </div>
      </div>
      
      <!-- Right Section - Login Card -->
      <div class="flex-1 max-w-md w-full">
        <div class="bg-blue-50/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-blue-100/50 transform hover:scale-[1.02] transition-transform duration-300">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="inline-block p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-slate-900 mb-2">Bienvenue</h2>
            <p class="text-slate-600">Connectez-vous pour continuer</p>
          </div>
          
          <!-- Form -->
          <form @submit.prevent="login" class="space-y-5">
            <!-- Email Field -->
            <div class="group">
              <label for="email" class="block text-sm font-semibold text-slate-700 mb-2">
                Adresse email
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </div>
                <input 
                  v-model="form.email" 
                  type="email" 
                  id="email"
                  class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white text-slate-900 placeholder-slate-400"
                  placeholder="vous@exemple.com"
                  required 
                />
              </div>
            </div>
            
            <!-- Password Field -->
            <div class="group">
              <label for="password" class="block text-sm font-semibold text-slate-700 mb-2">
                Mot de passe
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-slate-400 group-focus-within:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input 
                  v-model="form.mot_de_passe" 
                  type="password" 
                  id="password"
                  class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>
            
            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center">
                <input 
                  v-model="form.rememberMe" 
                  type="checkbox" 
                  id="rememberMe" 
                  class="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <label for="rememberMe" class="ml-2 text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                  Se souvenir de moi
                </label>
              </div>
              <a href="/forgot-password" class="text-sm font-semibold text-teal-600 hover:text-emerald-600 transition-colors">
                Mot de passe oublié ?
              </a>
            </div>
            
            <!-- Submit Button -->
            <button 
              type="submit" 
              class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-4 px-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span class="flex items-center justify-center space-x-2">
                <span>Se connecter</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </span>
            </button>
          </form>
          
          <!-- Error Message -->
          <div v-if="error" class="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p class="text-red-700 text-sm font-medium flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              {{ error }}
            </p>
          </div>
        </div>
        
        <!-- Copyright -->
        <div class="text-center mt-6 text-white">
          <p class="text-sm text-indigo-200">
            © 2025 Cahier de Texte - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  </div>
</template>



<script>
import api from '../api';

export default {
  data() {
    return {
      form: {
        email: '',
        mot_de_passe: '',
        rememberMe: false
      },
      error: null
    };
  },
  methods: {
    async login() {
      try {
        const response = await api.post('/auth/login', this.form);
        localStorage.setItem('token', response.data.token);
        const user = response.data.user; // Assure-toi que l'API renvoie l'utilisateur
       if (user.role === 'admin') {
          this.$router.push('/dashboard?section=accueil'); // Rediriger vers /dashboard avec section accueil
        } else if (user.role === 'enseignant') {
          this.$router.push('/enseignant'); // Rediriger vers Enseignant.vue
        } else {
          this.$router.push('/dashboard'); // Rediriger vers Dashboard.vue pour autres rôles
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Erreur de connexion';
      }
    }
  }
};
</script>

<style scoped>

@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

</style>