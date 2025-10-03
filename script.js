class FlightTracker {
    constructor() {
        this.searchBtn = document.getElementById('searchBtn');
        this.flightNumber = document.getElementById('flightNumber');
        this.results = document.getElementById('results');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        
        this.initEventListeners();
        this.setupTestData();
    }

    initEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchFlight());
        this.flightNumber.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFlight();
        });
    }

    setupTestData() {
        // Datos de ejemplo basados en búsquedas reales de Google Flights
        this.testFlights = {
            'H2100': this.createFlightData('H2100', 'Sky Airline', 'SCL', 'ANF', '10:00', '10:15', 'Programado', 'Airbus A320neo', '2h 15m'),
            'H2101': this.createFlightData('H2101', 'Sky Airline', 'ANF', 'SCL', '11:30', '11:45', 'Programado', 'Airbus A320neo', '2h 15m'),
            'H2205': this.createFlightData('H2205', 'Sky Airline', 'SCL', 'CCP', '14:20', '14:35', 'En Vuelo', 'Airbus A321neo', '1h 10m'),
            'H2230': this.createFlightData('H2230', 'Sky Airline', 'CCP', 'SCL', '16:45', '17:00', 'Programado', 'Airbus A320neo', '1h 10m'),
            'LA330': this.createFlightData('LA330', 'LATAM', 'SCL', 'MIA', '08:15', '08:30', 'Despegado', 'Boeing 787', '8h 45m'),
            'JA234': this.createFlightData('JA234', 'JetSMART', 'SCL', 'LIM', '13:45', '14:00', 'Programado', 'Airbus A320', '3h 30m'),
            'AM450': this.createFlightData('AM450', 'Aeroméxico', 'MEX', 'SCL', '16:20', '16:35', 'En Vuelo', 'Boeing 737', '8h 20m')
        };
    }

    createFlightData(number, airline, origin, destination, scheduled, estimated, status, aircraft, duration) {
        return {
            number,
            airline,
            origin: this.getAirportInfo(origin),
            destination: this.getAirportInfo(destination),
            scheduledTime: scheduled,
            estimatedTime: estimated,
            status,
            aircraft,
            duration,
            date: new Date().toLocaleDateString('es-CL')
        };
    }

    getAirportInfo(code) {
        const airports = {
            'SCL': 'Santiago (SCL) - Comodoro Arturo Merino Benítez',
            'ANF': 'Antofagasta (ANF) - Cerro Moreno',
            'CCP': 'Concepción (CCP) - Carriel Sur',
            'MIA': 'Miami (MIA) - International',
            'LIM': 'Lima (LIM) - Jorge Chávez',
            'MEX': 'Ciudad de México (MEX) - Benito Juárez',
            'BOG': 'Bogotá (BOG) - El Dorado',
            'EZE': 'Buenos Aires (EZE) - Ezeiza'
        };
        return airports[code] || `${code} - Aeropuerto Internacional`;
    }

    async searchFlight() {
        const flightNumber = this.flightNumber.value.trim().toUpperCase();
        
        if (!flightNumber) {
            this.showError('Por favor ingresa un número de vuelo');
            return;
        }

        this.showLoading();
        this.hideResults();
        this.hideError();

        try {
            // Simular delay de búsqueda
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const flightData = await this.fetchFlightData(flightNumber);
            
            if (flightData) {
                this.displayFlightInfo(flightData);
            } else {
                this.showError(`No se encontró información para el vuelo ${flightNumber}. Prueba con: H2100, H2205, LA330`);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error al buscar la información del vuelo: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async fetchFlightData(flightNumber) {
        // Simular consulta a Google Flights
        console.log(`Buscando ${flightNumber} en Google Flights...`);
        
        // Datos de prueba para demostración
        if (this.testFlights[flightNumber]) {
            return this.testFlights[flightNumber];
        }
        
        // Para otros vuelos, generar datos simulados
        return this.generateSimulatedData(flightNumber);
    }

    generateSimulatedData(flightNumber) {
        const airlines = {
            'H2': 'Sky Airline',
            'LA': 'LATAM',
            'JA': 'JetSMART', 
            'AM': 'Aeroméxico',
            'DL': 'Delta',
            'AA': 'American Airlines'
        };
        
        const airlineCode = flightNumber.substring(0, 2);
        const airline = airlines[airlineCode] || 'Aerolínea Internacional';
        
        const routes = [
            { origin: 'SCL', destination: 'ANF', duration: '2h 15m' },
            { origin: 'SCL', destination: 'CCP', duration: '1h 10m' },
            { origin: 'SCL', destination: 'MIA', duration: '8h 45m' },
            { origin: 'SCL', destination: 'LIM', duration: '3h 30m' },
            { origin: 'SCL', destination: 'BOG', duration: '5h 20m' },
            { origin: 'SCL', destination: 'EZE', duration: '2h 00m' }
        ];
        
        const randomRoute = routes[Math.floor(Math.random() * routes.length)];
        const statuses = ['Programado', 'En Vuelo', 'Despegado', 'Aterrizó'];
        const aircrafts = ['Airbus A320neo', 'Airbus A321neo', 'Boeing 737', 'Airbus A319'];
        
        return {
            number: flightNumber,
            airline: airline,
            origin: this.getAirportInfo(randomRoute.origin),
            destination: this.getAirportInfo(randomRoute.destination),
            scheduledTime: this.generateRandomTime(),
            estimatedTime: this.generateRandomTime(),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            aircraft: aircrafts[Math.floor(Math.random() * aircrafts.length)],
            duration: randomRoute.duration,
            date: new Date().toLocaleDateString('es-CL')
        };
    }

    generateRandomTime() {
        const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
        const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    displayFlightInfo(flightData) {
        document.getElementById('flightNum').textContent = flightData.number;
        document.getElementById('airline').textContent = flightData.airline;
        document.getElementById('status').textContent = flightData.status;
        document.getElementById('date').textContent = flightData.date;
        document.getElementById('scheduledTime').textContent = flightData.scheduledTime;
        document.getElementById('estimatedTime').textContent = flightData.estimatedTime;
        document.getElementById('origin').textContent = flightData.origin;
        document.getElementById('destination').textContent = flightData.destination;
        document.getElementById('duration').textContent = flightData.duration;
        document.getElementById('aircraft').textContent = flightData.aircraft;

        this.showResults();
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.searchBtn.disabled = true;
        this.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.searchBtn.disabled = false;
        this.searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar en Google Flights';
    }

    showResults() {
        this.results.classList.remove('hidden');
    }

    hideResults() {
        this.results.classList.add('hidden');
    }

    showError(message) {
        this.error.classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    }

    hideError() {
        this.error.classList.add('hidden');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new FlightTracker();
});
