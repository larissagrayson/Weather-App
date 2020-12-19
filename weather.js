function weather () {
    // Grab DOM Elements
    const form = document.querySelector('form#search');
    const loader = document.querySelector('.loader');
    const msgBox = document.querySelector('.msg');
    const weatherWrapper = document.querySelector('.weather-wrapper');
    const weatherToday = document.querySelector('.weather-today');
    const weather5Day = document.querySelector('.weather-forecast');


    // Get the latitude and longitude of the given location
    async function fetchLocation(query) {
        const endpoint = `https://nominatim.openstreetmap.org/?addressdetails=1&q=${query}&format=json&limit=1`;
        const response = await fetch(endpoint).catch(handleError);
        const data = await response.json();
        return data; 
    }

    // Get the weather forecast for the location
    async function fetchWeather(latitude, longitude, units) {
        const baseEndpoint = 'https://api.openweathermap.org/data/2.5/onecall';
        const key = '670b4de085771da8158a420b85ece951';
        const endpoint = `${baseEndpoint}?lat=${latitude}&lon=${longitude}&units=${units}&appid=${key}`;
        const response = await fetch(endpoint).catch(handleError);
        const data = await response.json();
        return data;
    }

    // Handle submision of the form
    async function handleSubmit(e) {
        e.preventDefault();
        fetchAndDisplay(form.location.value, form.temp.value).catch(handleError);
    }

    // Fetch weather data and then call display
    async function fetchAndDisplay(query, units) {
        // Turn form off
        form.submit.disabled = true;
    

        // Display the loader
        msgBox.classList.remove('hidden');
        msgBox.innerHTML = 'Getting Weather...';
        msgBox.style.color = 'black';
        loader.classList.remove('hidden');

        // Submit the search
        const location = await fetchLocation(query).catch(handleError);
        form.reset();

        if (!location[0]) {
            handleError('Location Not Found!');
        }
        else {
            const weather = await fetchWeather(location[0].lat, location[0].lon, units).catch(handleError);

            // Turn form back on
            form.submit.disabled = false;

            // Turn off the loader
            loader.classList.add('hidden');
            msgBox.innerHTML = '';
            msgBox.classList.add('hidden');

            displayWeather(query, weather, location, units)   //.catch(handleError);
        }
    }

    function handleError(err) {
        // Turn off the loader
        loader.classList.add('hidden');

        // Display the error message
        msgBox.classList.remove('hidden');
        msgBox.innerHTML = err;
        msgBox.style.color = 'red';
        form.submit.disabled = false;
    }

    // Display the weather on the DOM
    function displayWeather(query, weather, location, units) {
        weatherWrapper.classList.remove('hidden')
        // Find the City, State, or Country based on the location API response
        const city = location[0].address.place || location[0].address.town || location[0].address.city;
        const state = location[0].address.country_code === 'us' ? location[0].address.state : location[0].address.country;
        // If either value is not found, throw error
        if (!city || !state) throw 'Location Not Found!';

        // Get Today's weather data
        const sunrise = convertToTime(weather.current.sunrise, weather.timezone_offset);
        const sunset = convertToTime(weather.current.sunset, weather.timezone_offset);
        const temp = Math.round(weather.current.temp);
        const min = Math.round(weather.daily[0].temp.min);
        const max = Math.round(weather.daily[0].temp.max);
        const tempUnit = (units === 'imperial') ? 'F' : 'C';
        const forecast = weather.current.weather[0].main;
        const icon = weather.current.weather[0].icon;

        // Change background image based on forecast
        const background = getBackgroundImage(forecast);
        weatherWrapper.style.backgroundImage = `url(images/${background}.jpg`
    
        // Update HTML with Today's Weather
        const todayHtml = ` 
            <p class="city">${city}, ${state}</p>
            <img src="http://openweathermap.org/img/wn/${icon}@2x.png"> 
            <p class="temp">${temp}&deg;<span class="units">${tempUnit}</span></p>
            <p class="description">${forecast}</p>
            <div class="today-details">
                <div class="sun">
                    <p>Sunrise: ${sunrise} AM</p>
                    <p>Sunset: ${sunset} PM</p>
                </div>
                <div class="hi-lo">
                    <p>High: ${max}&deg;${tempUnit}</p>
                    <p>Low: ${min}&deg;${tempUnit}</p>
                </div>
            </div>
        `;
        weatherToday.innerHTML = todayHtml;

        // Update HTML with 5-Day Future Forecast
        const future = weather.daily;
        const futureHTML = future.map((day, index) => {
            if (index === 0 || index > 5) return;
            return ` 
            <div class="day">
                <p class="date">${convertToDate(day.dt)}</p>
                <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">
                <p class="temp">${Math.round(day.temp.max)}&deg;<span class='lo'>${Math.round(day.temp.min)}&deg;</span></p>
                <p class="description">${day.weather[0].main}</p>
            </div>`   
        }).join('');
        weather5Day.innerHTML = futureHTML;
    }

    // Formats UTC Time to a Day/Date
    function convertToDate(utc) {
        const formattedDate = new Date(utc * 1000);
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekday = weekdays[formattedDate.getDay()];
        const date = formattedDate.getDate();
        return `${weekday} ${date}`;
    }

    // Formats UTC Time to Time in Location's Timezone.
    function convertToTime(utc, offset) {
        const formattedTime = new Date(utc * 1000);
        const userOffset = formattedTime.getTimezoneOffset() * 60 * 1000; // User's offset from UTC
        const locationOffset = offset * 1000;  // Offset from UTC for query location
        const utcTime = new Date((formattedTime.getTime() + userOffset));
        const localTime = new Date(utcTime.getTime() + locationOffset);
        const hours = localTime.getHours() > 12 ? (localTime.getHours() - 12) : localTime.getHours();
        const mins = (localTime.getMinutes() < 10 ? '0' : '') + localTime.getMinutes();
        return `${hours}:${mins}`;
    }

    // Returns the background image based on given forecast
    function getBackgroundImage(forecast) {
        const other = 'Mist, Smoke, Haze, Dust, Fog, Sand, Ash, Squall, Tornado';
        if (forecast === 'Drizzle') return 'Rain';
        if (other.includes(forecast)) return 'Atmosphere';
        return forecast;
    }

    // Add Event Listeners
    form.addEventListener('submit', handleSubmit);

}

weather();