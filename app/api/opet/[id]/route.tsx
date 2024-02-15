import { NextRequest } from "next/server";
import { isValidId } from "@/utils/helper";

export const runtime = "edge";
export const preferredRegion = ["fra1", "cdg1", "dub1"];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  let links = [];
  let result = null;

  if (!isValidId(Number(id))) {
    return new Response("Geçersiz plaka", {
      status: 400,
    });
  }

  if (id === "34") {
    links = [
      [
        "https://api.opet.com.tr/api/fuelprices/prices?ProvinceCode=",
        34,
        "&IncludeAllProducts=true",
      ].join(""),
      [
        "https://api.opet.com.tr/api/fuelprices/prices?ProvinceCode=",
        934,
        "&IncludeAllProducts=true",
      ].join(""),
    ];
  } else {
    links = [
      [
        "https://api.opet.com.tr/api/fuelprices/prices?ProvinceCode=",
        id,
        "&IncludeAllProducts=true",
      ].join(""),
    ];
  }

  try {
    const responses = await Promise.all(links.map((link) => fetch(link)));
    const data = await Promise.all(responses.map((res) => res.json()));

    if (id === "34") {
      result = normalizeData([...data[0], ...data[1]]);
    } else {
      result = normalizeData(data);
    }

    return Response.json(result, {
      status: 200,
      headers: {
        "Content-type": "application/json; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600",
        "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
      },
    });
  } catch (error) {
    return new Response("Failed to fetch the data", { status: 500 });
  }
}

function normalizeData(data: any[]) {
  return {
    lastUpdate: new Date().toUTCString(),
    data: data.map((city: any) => {
      const a100 = city.prices.find((o: any) => o.productCode === "A100");
      const a128 = city.prices.find((o: any) => o.productCode === "A128");
      const a110 = city.prices.find((o: any) => o.productCode === "A110");

      return {
        ilce: city.districtName,
        benzin: a100.amount,
        mazot: a128.amount,
        lpg: a110.amount,
      };
    }),
  };
}