import { StyleSheet, Platform } from 'react-native';

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#06122a' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4d94c2' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#02101f' }] },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#03245b' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#0b2f4e' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#11456f' }]
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }]
    }
];

export default DARK_MAP_STYLE;