import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CHARACTERISTICS = [
  "Prix net vendeur",
  "Surface (m²)",
  "DPE",
  "Taxe foncière",
  "Charges",
  "Nombre de lots",
  "État général",
  "Nature travaux",
  "Coût travaux",
  "Statut locatif",
  "Type de bail",
  "Date fin bail",
  "Distance Paris",
];

const DEFAULT_PROPERTY_TYPES = [
  "Pharmacie",
  "La Poste",
  "France Travail",
  "Immeuble",
  "Local commercial",
  "Bureau",
  "Appartement",
  "Maison",
  "Entrepôt",
  "Parking",
  "Terrain",
  "Hôtel",
  "Restaurant",
  "Commerce alimentaire",
  "Supermarché",
];

async function main() {
  // Créer l'admin
  const hashedPassword = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@crmbrokerage.fr" },
    update: {},
    create: {
      email: "admin@crmbrokerage.fr",
      password: hashedPassword,
      name: "Administrateur",
      role: "ADMIN",
    },
  });

  console.log(`Admin créé: ${admin.email}`);

  // Créer les labels de caractéristiques par défaut
  for (const label of DEFAULT_CHARACTERISTICS) {
    await prisma.characteristicLabel.upsert({
      where: { label },
      update: {},
      create: { label, isDefault: true },
    });
  }

  console.log(
    `${DEFAULT_CHARACTERISTICS.length} caractéristiques par défaut créées`
  );

  // Créer les types de bien par défaut
  for (const label of DEFAULT_PROPERTY_TYPES) {
    await prisma.propertyTypeLabel.upsert({
      where: { label },
      update: {},
      create: { label, isDefault: true },
    });
  }

  console.log(
    `${DEFAULT_PROPERTY_TYPES.length} types de bien par défaut créés`
  );

  // Créer le compteur de référence pour l'année en cours
  const currentYear = new Date().getFullYear();
  await prisma.referenceCounter.upsert({
    where: { year: currentYear },
    update: {},
    create: { year: currentYear, count: 0 },
  });

  console.log(`Compteur de référence ${currentYear} initialisé`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
