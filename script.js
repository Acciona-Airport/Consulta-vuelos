// CONFIGURACIÓN CON TU API KEY
const API_KEY = '989afae2efmsh3b05b460633206dp158312jsnca5e37698981';

class FlightTracker {
    constructor() {
        this.searchBtn = document.getElementById('searchBtn');
        this.flightNumber = document.getElementById('flightNumber');
        this.results = document.getElementById('results');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.nextFlights = document.getElementById('nextFlights');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchFlight());
        this.flightNumber.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFlight();
        });
        
        // Ejemplo automático para probar
        this.flightNumber.addEventListener('focus', () => {
            if (!this.flightNumber.value) {
                this.flightNumber.value = 'H2';
            }
        });
    }

    async searchFlight() {
        let flightNumber = this.flightNumber.value.trim().toUpperCase();
        
        // Asegurar que empiece con H2
        if (!flightNumber.startsWith('H2')) {
            flightNumber = 'H2' + flightNumber.replace(/[^0-9]/g, '');
        }
        
        // Actualizar el campo de entrada
        this.flightNumber.value = flightNumber;
        
        if (!flightNumber || flightNumber === 'H2') {
            this.showError('Por favor ingresa un número de vuelo completo (ej: H2123)');
            return;
        }

        // Validar formato H2 + números
        if (!/^H2\d+$/.test(flightNumber)) {
            this.showError('Formato incorrecto. Use: H2 + números (ej: H2123)');
            return;
        }

        this.showLoading();
        this.hideResults();
        this.hideError();

        try {
            const flightData = await this.fetchFlightData(flightNumber);
            
            if (flightData && flightData.length > 0) {
                this.displayFlightInfo(flightData[0]);
                
                // Buscar próximos vuelos de la misma aeronave
                const registration = flightData[0].aircraft?.registration;
                if (registration) {
                    await this.fetchNextFlights(registration, flightNumber);
                } else {
                    this.hideNextFlights();
                }
            } else {
                this.showError('No se encontró información para el vuelo ' + flightNumber);
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('429')) {
                this.showError('Límite de consultas excedido. Intenta en unos minutos.');
            } else {
                this.showError('Error al buscar la información del vuelo: ' + error.message);
            }
        } finally {
            this.hideLoading();
        }
    }

    async fetchFlightData(flightNumber) {
        const url = `https://aerodatabox.p.rapidapi.com/flights/number/${flightNumber}`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
            }
        };

        console.log('Buscando vuelo:', flightNumber);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Límite de consultas excedido (429)');
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        return data;
    }

    async fetchNextFlights(registration, currentFlightNumber) {
        try {
            console.log('Buscando próximos vuelos para matrícula:', registration);
            
            const url = `https://aerodatabox.p.rapidapi.com/aircrafts/reg/${registration}/flights`;
            const options = {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': API_KEY,
                    'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
                }
            };

            const response = await fetch(url, options);
            
            if (response.ok) {
                const data = await response.json();
                this.displayNextFlights(data, currentFlightNumber);
            } else {
                console.log('No se pudieron obtener próximos vuelos');
                this.hideNextFlights();
            }
        } catch (error) {
            console.error('Error fetching next flights:', error);
            this.hideNextFlights();
        }
    }

    displayFlightInfo(flight) {
        console.log('Mostrando información del vuelo:', flight);
        
        // Formatear y mostrar información
        document.getElementById('flightNum').textContent = flight.number || 'N/A';
        document.getElementById('registration').textContent = flight.aircraft?.registration || 'No disponible';
        document.getElementById('sta').textContent = this.formatDateTime(flight.schedule?.scheduledTime?.utc);
        document.getElementById('eta').textContent = this.formatDateTime(flight.schedule?.estimatedTime?.utc) || 'Por confirmar';
        document.getElementById('origin').textContent = this.formatAirport(flight.departure);
        document.getElementById('destination').textContent = this.formatAirport(flight.arrival);
        document.getElementById('status').textContent = this.translateStatus(flight.status) || 'No disponible';
        document.getElementById('airline').textContent = flight.airline?.name || 'Sky Airline';

        this.showResults();
    }

    displayNextFlights(flightsData, currentFlightNumber) {
        const nextFlightsList = document.getElementById('nextFlightsList');
        nextFlightsList.innerHTML = '';

        if (!flightsData || !flightsData.schedule || flightsData.schedule.length === 0) {
            nextFlightsList.innerHTML = '<p>No se encontraron próximos vuelos para esta aeronave</p>';
            this.showNextFlights();
            return;
        }

        // Filtrar vuelos H2 futuros (excluyendo el actual)
        const futureFlights = flightsData.schedule
            .filter(flight => {
                const isSkyFlight = flight.flight?.number?.startsWith('H2');
                const isNotCurrent = flight.flight?.number !== currentFlightNumber;
                const isFuture = new Date(flight.departure?.scheduledTime?.utc) > new Date();
                
                return isSkyFlight && isNotCurrent && isFuture;
            })
            .slice(0, 5); // Mostrar máximo 5 próximos vuelos

        if (futureFlights.length === 0) {
            nextFlightsList.innerHTML = '<p>No se encontraron próximos vuelos Sky para esta aeronave</p>';
            this.showNextFlights();
            return;
        }

        futureFlights.forEach(flight => {
            const flightItem = document.createElement('div');
            flightItem.className = 'flight-item';
            
            flightItem.innerHTML = `
                <div>
                    <span class="flight-number">${flight.flight?.number || 'N/A'}</span>
                    <div class="flight-route">
                        ${flight.departure?.airport?.iata || 'N/A'} → ${flight.arrival?.airport?.iata || 'N/A'}
                    </div>
                </div>
                <div>
                    <span>${this.formatDateTime(flight.departure?.scheduledTime?.utc)}</span>
                </div>
            `;
            
            nextFlightsList.appendChild(flightItem);
        });

        this.showNextFlights();
    }

    formatDateTime(utcTime) {
        if (!utcTime) return 'No disponible';
        
        try {
            const date = new Date(utcTime);
            return date.toLocaleString('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Santiago'
            });
        } catch (error) {
            return 'Fecha no válida';
        }
    }

    formatAirport(airportInfo) {
        if (!airportInfo || !airportInfo.airport) return 'No disponible';
        
        const airport = airportInfo.airport;
        return `${airport.iata || 'N/A'} - ${airport.name || 'N/A'} (${airport.municipalityName || 'N/A'})`;
    }

    translateStatus(status) {
        const statusMap = {
            'scheduled': 'Programado',
            'active': 'En vuelo',
            'landed': 'Aterrizó',
            'cancelled': 'Cancelado',
            'incident': 'Incidente',
            'diverted': 'Desviado'
        };
        
        return statusMap[status] || status;
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.searchBtn.disabled = true;
        this.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.searchBtn.disabled = false;
        this.searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar';
    }

    showResults() {
        this.results.classList.remove('hidden');
    }

    hideResults() {
        this.results.classList.add('hidden');
    }

    showNextFlights() {
        this.nextFlights.classList.remove('hidden');
    }

    hideNextFlights() {
        this.nextFlights.classList.add('hidden');
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
