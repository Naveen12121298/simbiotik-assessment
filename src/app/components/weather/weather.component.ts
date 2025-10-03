import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { debounceTime, switchMap, catchError, tap } from 'rxjs/operators';
import { WeatherService } from '../../services/weather.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {
  cityControl = new FormControl('Bengaluru');
  currentWeather: any;
  forecast: any[] = [];
  loading = false;
  error = false;
  iconUrl:any;

  private citySubject = new BehaviorSubject<string>('Bengaluru');

  constructor(private weatherService: WeatherService) {}

 noData = false;

ngOnInit() {
  this.citySubject.pipe(
    tap(() => {
      this.loading = true;
      this.error = false;
      this.noData = false; // reset
    }),
    switchMap(city => {
      if (!city || city.trim() === '') {
        this.loading = false;
        this.noData = true;
        return of(null);
      }
      return this.weatherService.getWeatherData(city).pipe(
        catchError(err => {
          this.error = true;
          return of(null);
        })
      );
    })
  ).subscribe(res => {
    if (res) {
      this.currentWeather = res.current;
      this.forecast = res.forecast;
      this.iconUrl = `https://openweathermap.org/img/wn/${this.currentWeather.weather[0].icon}@2x.png`;
      this.noData = this.forecast.length === 0 && !this.currentWeather;
    } else if (!this.cityControl.value) {
      this.noData = true;
    }
    this.loading = false;
  });

this.cityControl.valueChanges.pipe(
  debounceTime(500)
).subscribe(city => {
  const trimmedCity = (city || '').trim();

  if (!trimmedCity) {
    // input is empty
    this.currentWeather = null;
    this.forecast = [];
    this.noData = true;
    this.loading = false;
    this.error = false;
  }

  this.citySubject.next(trimmedCity);// fallback to empty string if null
});


  // Initial fetch
  this.citySubject.next('Bengaluru');
}


retry() {
  const city = (this.cityControl.value || '').trim();
  if (city) {
    this.citySubject.next(city); // triggers API call again
  } else {
    this.noData = true;          // show no data if input empty
    this.currentWeather = null;
    this.forecast = [];
  }
  this.error = false;            // reset error state
}

}
