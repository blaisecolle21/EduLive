// services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuration du transporteur email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Envoyer une notification par email
   */
  async envoyerNotification(destinataire, notification) {
    try {
      const categorieEmoji = {
        'felicitations': '🎉',
        'encouragement': '💪',
        'avertissement': '⚠️',
        'alerte': '🚨',
        'critique': '🔴',
        'avance_excessive': '⚡',
        'info': 'ℹ️'
      };

      const emoji = categorieEmoji[notification.categorie] || 'ℹ️';

      const mailOptions = {
        from: `"Plateforme Cahier de Texte" <${process.env.SMTP_USER}>`,
        to: destinataire.email,
        subject: `${emoji} ${notification.titre}`,
        html: this.genererTemplateEmail(destinataire, notification)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email envoyé:', info.messageId);
      return true;

    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Générer le template HTML de l'email
   */
  genererTemplateEmail(destinataire, notification) {
    const couleurCategorie = {
      'felicitations': '#10b981',
      'encouragement': '#3b82f6',
      'avertissement': '#f59e0b',
      'alerte': '#ef4444',
      'critique': '#dc2626',
      'avance_excessive': '#8b5cf6',
      'info': '#6b7280'
    };

    const couleur = couleurCategorie[notification.categorie] || '#6b7280';

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${notification.titre}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- En-tête -->
              <tr>
                <td style="background: linear-gradient(135deg, ${couleur} 0%, ${couleur}dd 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                    ${notification.titre}
                  </h1>
                </td>
              </tr>

              <!-- Corps -->
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Bonjour <strong>${destinataire.prenoms} ${destinataire.nom}</strong>,
                  </p>

                  <div style="background-color: #f9fafb; border-left: 4px solid ${couleur}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin: 0;">
                      ${notification.message.replace(/\n/g, '<br>')}
                    </p>
                  </div>

                  ${notification.progression_actuelle ? `
                    <table width="100%" cellpadding="10" cellspacing="0" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
                      <tr style="background-color: #f9fafb;">
                        <td style="font-weight: bold; color: #374151;">Progression actuelle:</td>
                        <td style="text-align: right; color: ${couleur}; font-weight: bold; font-size: 18px;">
                          ${notification.progression_actuelle}%
                        </td>
                      </tr>
                      ${notification.ecart_jours !== null ? `
                        <tr>
                          <td style="color: #6b7280;">Écart détecté:</td>
                          <td style="text-align: right; color: #374151; font-weight: 500;">
                            ${notification.ecart_jours > 0 ? '+' : ''}${notification.ecart_jours} jour(s)
                          </td>
                        </tr>
                      ` : ''}
                      ${notification.semaine_attendue ? `
                        <tr>
                          <td style="color: #6b7280;">Période de référence:</td>
                          <td style="text-align: right; color: #374151;">
                            ${notification.semaine_attendue} (${notification.mois_attendu})
                          </td>
                        </tr>
                      ` : ''}
                    </table>
                  ` : ''}

                  ${notification.probleme_chronologie ? `
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="color: #92400e; margin: 0; font-size: 14px;">
                        ⚠️ <strong>Attention:</strong> ${notification.details_chronologie}
                      </p>
                    </div>
                  ` : ''}

                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                    Vous pouvez consulter le détail de votre progression sur votre tableau de bord.
                  </p>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/enseignant" 
                       style="display: inline-block; background-color: ${couleur}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Accéder à mon tableau de bord
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Pied de page -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">
                    Plateforme de Gestion de Cahier de Texte<br>
                    ${new Date().getFullYear()} - Tous droits réservés
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                    Cet email est automatique, merci de ne pas y répondre.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  /**
   * Envoyer un message personnalisé (admin)
   */
  async envoyerMessagePersonnalise(destinataires, titre, message, adminNom) {
    const resultats = [];

    for (const destinataire of destinataires) {
      try {
        const mailOptions = {
          from: `"${adminNom} - Administration" <${process.env.SMTP_USER}>`,
          to: destinataire.email,
          subject: `📢 ${titre}`,
          html: this.genererTemplateMessagePersonnalise(destinataire, titre, message, adminNom)
        };

        const info = await this.transporter.sendMail(mailOptions);
        resultats.push({ 
          email: destinataire.email, 
          success: true, 
          messageId: info.messageId 
        });

      } catch (error) {
        console.error(`❌ Erreur envoi à ${destinataire.email}:`, error);
        resultats.push({ 
          email: destinataire.email, 
          success: false, 
          error: error.message 
        });
      }
    }

    return resultats;
  }

  /**
   * Template pour message personnalisé
   */
  genererTemplateMessagePersonnalise(destinataire, titre, message, adminNom) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titre}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- En-tête -->
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                    📢 ${titre}
                  </h1>
                </td>
              </tr>

              <!-- Corps -->
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Bonjour <strong>${destinataire.prenoms} ${destinataire.nom}</strong>,
                  </p>

                  <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="color: #1f2937; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap;">
                      ${message}
                    </p>
                  </div>

                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                    Message envoyé par <strong>${adminNom}</strong> (Administration)
                  </p>
                </td>
              </tr>

              <!-- Pied de page -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 13px; margin: 0;">
                    Plateforme de Gestion de Cahier de Texte<br>
                    ${new Date().getFullYear()} - Tous droits réservés
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  /**
   * Vérifier la connexion SMTP
   */
  async verifierConnexion() {
    try {
      await this.transporter.verify();
      console.log('✅ Serveur SMTP prêt');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion SMTP:', error);
      return false;
    }
  }
}

module.exports = new EmailService();