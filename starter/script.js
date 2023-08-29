'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//CLASES------------------------------------------------->
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, duration, distance) {
    this.coords = coords;
    this.duration = duration; //km
    this.distance = distance; //min
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }
}

class Running extends Workout {
  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.type = 'running';
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, duration, distance, elevation) {
    super(coords, duration, distance);
    this.elevation = elevation;
    this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycle1 = new Cycling([39, -12], 5.2, 24, 178);
console.log(run1, cycle1);

//APP ARQUITECTURE
/////////////-------------------------------------->>>>>>>>>>>>>>>>>>
class App {
  #map;
  #mapEvent;
  constructor(map, mapEvent) {
    this.activities = [];
    this.#map = map;
    this.#mapEvent = mapEvent;
    this._getPosition();

    inputType.addEventListener('change', this._toggleElevationField);

    form.addEventListener('submit', this._newWorkout.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }

  _loadMap(position) {
    //GEOLOCATION API - OBTENER COORDENADAS
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    console.log(latitude, longitude);
    console.log(
      `https://www.google.com/maps/@${latitude},${longitude},15z?entry=ttu`
    );

    //DESPLEGAR EL MAPA - LEAFLET
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //PONER EL MAP MARKER
    this.#map.on('click', this._showForm.bind(this));

    this.activities.forEach(act => {
      this._renderWorkout(act);
      this._renderWorkoutMarker(act);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Clear Inputs.
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField(e) {
    e.preventDefault();

    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    //Obtener Datos del Form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //Si es running, crear una para running
    if (type === 'running') {
      const cadence = Number(inputCadence.value);
      //Checkear si la data es valida
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence)
      ) {
        return alert('All elements should be a Number');
      }

      workout = new Running([lat, lng], duration, distance, cadence);
    }
    //Si es para cycling crear una para cycling

    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);
      //Checkear si la data es valida
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(elevation)
      ) {
        return alert('All elements should be a Number');
      }
      workout = new Cycling([lat, lng], duration, distance, elevation);
    }
    //Añadir objeto a arreglo de workouts
    console.log(workout);
    this.activities.push(workout);

    //Render Workout al mapa con un marker
    this._renderWorkoutMarker(workout);

    //Render Workout en la lista

    this._renderWorkout(workout);

    //Esconder el form
    this._hideForm();

    //Set local Storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    //CREAR MARKER.
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️ ' : '🚴‍♀️ '} ${workout.description} `
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let HTML = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      HTML += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }

    if (workout.type === 'cycling') {
      HTML += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }

    form.insertAdjacentHTML('afterend', HTML);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.activities));
  }

  _getLocalStorage() {
    this.activities = JSON.parse(localStorage.getItem('workouts'));

    this.activities.forEach(act => {
      this._renderWorkout(act);
    });
  }
}

const app = new App();
