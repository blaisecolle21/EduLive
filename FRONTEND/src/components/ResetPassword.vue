<template>
     <div class="min-h-screen flex items-center justify-center bg-gray-100">
       <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
         <h2 class="text-2xl font-bold mb-4 text-center">Réinitialiser le mot de passe</h2>
         <form @submit.prevent="resetPassword">
           <div class="mb-4">
             <label class="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
             <input v-model="form.newPassword" type="password" class="w-full p-2 border rounded" required />
           </div>
           <button type="submit" class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Réinitialiser</button>
         </form>
         <p v-if="message" class="text-green-500 mt-4">{{ message }}</p>
         <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
       </div>
     </div>
   </template>

   <script>
   import api from '../api';

   export default {
     data() {
       return {
         form: {
           newPassword: '',
           token: this.$route.params.token
         },
         message: null,
         error: null
       };
     },
     methods: {
       async resetPassword() {
         try {
           const response = await api.post('/auth/reset-password', this.form);
           this.message = response.data.message;
           setTimeout(() => this.$router.push('/login'), 3000);
         } catch (error) {
           this.error = error.response?.data?.error || 'Erreur';
         }
       }
     }
   };
   </script>