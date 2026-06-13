document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');

    // Trigger search on button click
    searchButton.addEventListener('click', () => {
        const city = searchInput.value.trim();
        if (city) getCoordinates(city);
    });

    // Trigger search on Enter key press
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = searchInput.value.trim();
            if (city) getCoordinates(city);
        }
    });

    // Initial load default city
    getCoordinates('New York');
});

// Step 1: Convert City Name to Latitude & Longitude
async function getCoordinates(city) {
    const geoUrl = `https://openstreetmap.org{encodeURIComponent(city)}&limit=1`;
    
    try {
        const response = await fetch(geoUrl, {
            headers: { 'User-Agent': 'WeatherAppProject' }
        });
        const data = await response.json();
        
        if (data.length === 0) {
            alert('City not found. Please try again.');
            return;
        }

        const { lat, lon, display_name } = data[0];
        // Extract just the city name from the full descriptive string
        const cleanName = display_name.split(',')[0]; 
        
        fetchWeatherData(lat, lon, cleanName);
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        alert('Failed to look up city location.');
    }
}

// Step 2: Fetch Weather Data from Open-Meteo
async function fetchWeatherData(lat, lon, cityName) {
    const weatherUrl = `https://open-meteo.com{lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    try {
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        updateUI(data, cityName);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Failed to retrieve weather data.');
    }
}

// Step 3: Map Weather Codes to FontAwesome Icons and Description Text
function getWeatherDetails(code) {
    // WMO Weather Interpretation Codes (WMOCodes)
    const mapping = {
        0: { text: 'Clear Sky', icon: 'fa-sun' },
        1: { text: 'Mainly Clear', icon: 'fa-cloud-sun' },
        2: { text: 'Partly Cloudy', icon: 'fa-cloud-sun' },
        3: { text: 'Overcast', icon: 'fa-cloud' },
        45: { text: 'Foggy', icon: 'fa-smog' },
        48: { text: 'Depositing Rime Fog', icon: 'fa-smog' },
        51: { text: 'Light Drizzle', icon: 'fa-cloud-rain' },
        53: { text: 'Moderate Drizzle', icon: 'fa-cloud-rain' },
        55: { text: 'Dense Drizzle', icon: 'fa-cloud-rain' },
        61: { text: 'Slight Rain', icon: 'fa-cloud-showers-water' },
        63: { text: 'Moderate Rain', icon: 'fa-cloud-showers-heavy' },
        65: { text: 'Heavy Rain', icon: 'fa-cloud-showers-heavy' },
        71: { text: 'Slight Snow', icon: 'fa-snowflake' },
        73: { text: 'Moderate Snow', icon: 'fa-snowflake' },
        75: { text: 'Heavy Snow', icon: 'fa-snowflake' },
        80: { text: 'Slight Showers', icon: 'fa-cloud-sun-rain' },
        81: { text: 'Moderate Showers', icon: 'fa-cloud-sun-rain' },
        82: { text: 'Violent Showers', icon: 'fa-cloud-showers-heavy' },
        95: { text: 'Thunderstorm', icon: 'fa-cloud-bolt' }
    };
    return mapping[code] || { text: 'Unknown Conditions', icon: 'fa-cloud' };
}

// Step 4: Update DOM Elements
function updateUI(data, cityName) {
    const current = data.current;
    const daily = data.daily;
    const currentDetails = getWeatherDetails(current.weather_code);

    // Update Main Hero Details
    document.querySelector('.location').textContent = cityName;
    document.querySelector('.temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.querySelector('.condition').textContent = currentDetails.text;
    
    const mainIconContainer = document.querySelector('.weather-icon');
    mainIconContainer.innerHTML = `<i class="fa-solid ${currentDetails.icon}"></i>`;

    // Update Current Metrics Grid
    document.querySelectorAll('.metric-value')[0].textContent = `${current.relative_humidity_2m}%`;
    document.querySelectorAll('.metric-value')[1].textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.querySelectorAll('.metric-value')[2].textContent = `${Math.round(current.uv_index)} / 10`;

    // Update 3-Day Forecast Section
    const forecastRows = document.querySelectorAll('.forecast-row');
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 3; i++) {
        // Parse date to extract local day string
        const dateObj = new Date(daily.time[i + 1] + 'T00:00'); 
        const dayName = daysOfWeek[dateObj.getDay()];
        const forecastDetails = getWeatherDetails(daily.weather_code[i + 1]);
        const maxTemp = Math.round(daily.temperature_2m_max[i + 1]);
        const minTemp = Math.round(daily.temperature_2m_min[i + 1]);

        // Inject new content to forecast rows
        forecastRows[i].innerHTML = `
            <span class="day">${dayName}</span>
            <i class="fa-solid ${forecastDetails.icon}"></i>
            <span class="forecast-temp">${maxTemp}°C / ${minTemp}°C</span>
        `;
    }
}
