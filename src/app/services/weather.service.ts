import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WeatherService {

  apiKey = 'd24e2bc7f798fdc3c705db0b6bc00e67';

  constructor(private http: HttpClient) {}

  getWeatherData(city: string) {
    // 1. Get lat/lon from city name
    return this.http.get<any>(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${this.apiKey}`)
      .pipe(
        switchMap((res: any) => {
          if (res.length === 0) throw new Error('City not found');
          const { lat, lon } = res[0];

          // Current weather
          const currentWeather$ = this.http.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`);

          // 5-day forecast (3-hour interval)
          const forecast$ = this.http.get<any>(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`)
            .pipe(
              map(res => {
                const dailyTemps: { [date: string]: number[] } = {};
                res.list.forEach((item: any) => {
                  const date = item.dt_txt.split(' ')[0];
                  if (!dailyTemps[date]) dailyTemps[date] = [];
                  dailyTemps[date].push(item.main.temp);
                });

                // Get next 7 days including today
                return Object.keys(dailyTemps).slice(0, 7).map(date => {
                  const temps = dailyTemps[date];
                  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
                  return { date, avgTemp: avg.toFixed(1) };
                });
              })
            );

          return forkJoin([currentWeather$, forecast$]);
        }),
        map(([current, forecast]: any) => ({ current, forecast }))
      );
  }
}
