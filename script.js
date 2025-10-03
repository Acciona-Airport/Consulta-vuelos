// No necesita API key para consultas básicas
class FlightTracker {
    constructor() {
        this.searchBtn = document.getElementById('searchBtn');
        this.flightNumber = document.getElementById('flightNumber');
        this.results = document.getElementById('results');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchFlight());
        this.flightNumber.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFlight();
        });
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
            // Primero buscar en FlightRadar24
            const fr24Data = await this.searchFlightRadar24(flightNumber);
            
            if (fr24Data) {
                this.displayFlightInfo(fr24Data);
            } else {
                // Si no encuentra, buscar en AviationStack como respaldo
                const aviationData = await this.searchAviationStack(flightNumber);
                if (aviationData) {
                    this.displayFlightInfo(aviationData);
                } else {
                    this.showError(`No se encontró información para ${flightNumber}`);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Error en la búsqueda: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async searchFlightRadar24(flightNumber) {
        try {
            // FlightRadar24 API pública para búsqueda
            const searchUrl = `https://www.flightradar24.com/v1/search/web/find?query=${flightNumber}&limit=10`;
            
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) throw new Error('Error en FlightRadar24');
            
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const flight = data.results[0];
                return await this.getFlightDetails(flight.id);
            }
            return null;
            
        } catch (error) {
            console.log('FlightRadar24 no disponible, usando respaldo');
            return null;
        }
    }

    async getFlightDetails(flightId) {
        try {
            const detailUrl = `https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=${flightId}`;
            
            const response = await fetch(detailUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) throw new Error('Error en detalles');
            
            const data = await response.json();
            
            return {
                number: data.identification.number.default,
                registration: data.aircraft.registration,
                model: data.aircraft.model.code,
                airline: data.airline.name,
                status: this.translateStatus(data.status.text),
                origin: `${data.airport.origin.code.iata} - ${data.airport.origin.name}`,
                destination: `${data.airport.destination.code.iata} - ${data.airport.destination.name}`,
                scheduledDeparture: this.formatTime(data.time.scheduled.departure),
                scheduledArrival: this.formatTime(data.time.scheduled.arrival),
                estimatedDeparture: this.formatTime(data.time.estimated.departure),
                estimatedArrival: this.formatTime(data.time.estimated.arrival),
                source: 'FlightRadar24'
            };
            
        } catch (error) {
            console.error('Error en detalles:', error);
            return null;
        }
    }

    async searchAviationStack(flightNumber) {
        try {
            // Usar AviationStack como respaldo (necesitas API key gratis)
            const API_KEY = 'TU_API_KEY_AVIATIONSTACK'; // Obtén gratis en aviationstack.com
            const url = `http://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error AviationStack');
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                const flight = data.data[0];
                return {
                    number: flight.flight.iata,
                    registration: flight.aircraft.registration,
                    model: flight.aircraft.iata,
                    airline: flight.airline.name,
                    status: this.translateStatus(flight.flight_status),
                    origin: `${flight.departure.iata} - ${flight.departure.airport}`,
                    destination: `${flight.arrival.iata} - ${flight.arrival.airport}`,
                    scheduledDeparture: flight.departure.scheduled,
                    scheduledArrival: flight.arrival.scheduled,
                    estimatedDeparture: flight.departure.estimated,
                    estimatedArrival: flight.arrival.estimated,
                    source: 'AviationStack'
                };
            }
            return null;
            
        } catch (error) {
            console.log('AviationStack no disponible');
            return null;
        }
    }

    translateStatus(status) {
        const statusMap = {
            'scheduled': 'Programado',
            'active': 'En Vuelo',
            'landed': 'Aterrizó',
            'cancelled': 'Cancelado',
            'incident': 'Incidente',
            'diverted': 'Desviado',
            'departed': 'Despegó'
        };
        return statusMap[status] || status;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp * 1000).toLocaleTimeString('es-CL');
    }

    displayFlightInfo(flightData) {
        document.getElementById('flightNum').textContent = flightData.number || 'N/A';
        document.getElementById('registration').textContent = flightData.registration || 'No disponible';
        document.getElementById('airline').textContent = flightData.airline || 'N/A';
        document.getElementById('status').textContent = flightData.status || 'N/A';
        document.getElementById('aircraftModel').textContent = flightData.model || 'N/A';
        document.getElementById('scheduledDeparture').textContent = flightData.scheduledDeparture || 'N/A';
        document.getElementById('estimatedDeparture').textContent = flightData.estimatedDeparture || 'N/A';
        document.getElementById('scheduledArrival').textContent = flightData.scheduledArrival || 'N/A';
        document.getElementById('estimatedArrival').textContent = flightData.estimatedArrival || 'N/A';
        document.getElementById('origin').textContent = flightData.origin || 'N/A';
        document.getElementById('destination').textContent = flightData.destination || 'N/A';
        document.getElementById('dataSource').textContent = flightData.source || 'N/A';

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
        this.searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar';
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

document.addEventListener('DOMContentLoaded', () => {
    new FlightTracker();
});
