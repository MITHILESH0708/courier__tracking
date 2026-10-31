// Calculates ETA based on Haversine distance and assumed 30km/h speed
const calculateETA = (currentLat, currentLng, dropLat, dropLng) => {
    const R = 6371; // Earth radius in km
    const dLat = (dropLat - currentLat) * Math.PI / 180;
    const dLng = (dropLng - currentLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentLat * Math.PI / 180) * Math.cos(dropLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    const speedKmH = 30; // Average courier speed
    const hours = distanceKm / speedKmH;
    
    // Add estimated hours to current time
    const etaDate = new Date();
    etaDate.setMinutes(etaDate.getMinutes() + (hours * 60));
    return etaDate;
};

module.exports = { calculateETA };