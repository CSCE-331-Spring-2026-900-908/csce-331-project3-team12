export async function GET() {
  const lat = 30.61;   // College Station
  const lon = -96.34;

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`
  );

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch weather" }, { status: 500 });
  }

  const data = await res.json();

  return Response.json({
    temp: data.current_weather.temperature,
    windspeed: data.current_weather.windspeed,
    weathercode: data.current_weather.weathercode,
  });
}