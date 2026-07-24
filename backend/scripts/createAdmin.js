require("dotenv").config();
const { sequelize, models } = require("../src/config/database");

async function main() {
  await sequelize.authenticate();
  console.log("✅ Connecté à la base");

  // 1. Vérifier/créer le rôle admin (role_id = 1 confirmé)
  let role = await models.Role.findByPk(1);
  if (!role) {
    role = await models.Role.create({
      id: 1,
      name: "admin",
      description: "Administrateur principal",
    });
    console.log("✅ Rôle admin créé (id 1)");
  } else {
    console.log("ℹ️ Rôle id 1 déjà existant :", role.name);
  }

  // 2. Vérifier/créer un établissement par défaut
  let etablissement = await models.Etablissement.findOne();
  if (!etablissement) {
    etablissement = await models.Etablissement.create({
      nom: "CS Saint-Roger",
      code_etablissement: "LR001", //
      email: "saintroger@gmail.com",
    });
    console.log("✅ Établissement créé:", etablissement.nom);
  } else {
    console.log("ℹ️ Établissement déjà existant :", etablissement.nom);
  }

  // 3. Créer l'admin
  const existing = await models.User.findOne({
    where: { email: "abcolle21@gmail.com" },
  });
  if (existing) {
    console.log("⚠️ Un utilisateur avec cet email existe déjà, arrêt.");
    process.exit(0);
  }

  const admin = await models.User.create({
    nom: "COLLE",
    prenoms: "Blaise",
    email: "abcolle21@gmail.com",
    mot_de_passe: "bla123",
    role_id: role.id,
    etablissement_id: etablissement.id,
    est_actif: true,
    est_valide: true,
  });

  console.log("✅ Admin créé :", admin.email);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
