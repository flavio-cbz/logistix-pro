import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/services/auth"
import { db, generateId, getCurrentTimestamp } from "@/lib/services/db"
import { cacheService } from "@/app/api/v1/cache/cache-service" // Import du service de cache

interface HistoricalPriceData {
  price: number;
  sales_volume: number;
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return new NextResponse(JSON.stringify({ message: "Non authentifié" }), { status: 401 })
    }

    const data = await request.json()
    const { productName, price, salesVolume } = data

    if (!productName || !price || salesVolume === undefined) {
      return new NextResponse(JSON.stringify({ message: "Données manquantes pour l'enregistrement historique" }), { status: 400 })
    }

    const id = generateId()
    const timestamp = getCurrentTimestamp()

    db.prepare(`
      INSERT INTO historical_prices (id, product_name, date, price, sales_volume, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, productName, timestamp, price, salesVolume, timestamp)

    return new NextResponse(JSON.stringify({ message: "Donnée historique enregistrée", id }), { status: 201 })
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des données historiques:", error)
    return new NextResponse(JSON.stringify({ message: "Erreur interne du serveur" }), { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return new NextResponse(JSON.stringify({ message: "Non authentifié" }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productName = searchParams.get("productName")

    if (!productName) {
      return new NextResponse(JSON.stringify({ message: "Nom du produit manquant" }), { status: 400 })
    }

    const cacheKey = `historical_prices:${productName}`;
    const cachedData = await cacheService.get<{ recommendedPrice: number | null; message?: string }>(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const historicalData: HistoricalPriceData[] = db.prepare(`
      SELECT price, sales_volume FROM historical_prices WHERE product_name = ? ORDER BY date DESC
    `).all(productName) as HistoricalPriceData[];

    if (historicalData.length === 0) {
      const noDataResponse = { recommendedPrice: null, message: "Aucune donnée historique pour ce produit" };
      await cacheService.set(cacheKey, noDataResponse, 3600); // Cache pour 1 heure
      return NextResponse.json(noDataResponse);
    }

    // Trier les données par volume de ventes décroissant
    historicalData.sort((a, b) => b.sales_volume - a.sales_volume);

    // Prendre les 25% des données avec le plus grand volume de ventes
    const topSalesData = historicalData.slice(0, Math.ceil(historicalData.length * 0.25));

    let totalWeightedPrice = 0;
    let totalSalesVolume = 0;

    for (const data of topSalesData) {
      totalWeightedPrice += (data.price * data.sales_volume);
      totalSalesVolume += data.sales_volume;
    }

    const recommendedPrice = totalSalesVolume > 0 ? (totalWeightedPrice / totalSalesVolume) : historicalData[0].price;
    const responseData = { recommendedPrice: parseFloat(recommendedPrice.toFixed(2)) };

    await cacheService.set(cacheKey, responseData, 3600); // Cache pour 1 heure

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erreur lors de la récupération des données historiques ou du calcul du prix recommandé:", error)
    return new NextResponse(JSON.stringify({ message: "Erreur interne du serveur" }), { status: 500 })
  }
}