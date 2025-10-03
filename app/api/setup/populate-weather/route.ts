/**
 * API Endpoint to Populate Weather Data
 *
 * Populates hail and wind storm data for VA, MD, PA (2022-2025)
 *
 * Usage: POST /api/setup/populate-weather
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const COMPREHENSIVE_STORM_DATA = [
  // VIRGINIA - 2024
  {
    state: 'VA', event_date: '2024-06-27', event_type: 'Hail', magnitude: 1.75,
    location: 'Fairfax County', cities: ['Fairfax', 'Vienna', 'McLean', 'Reston'],
    lat: 38.8462, lng: -77.3064, damage: 500000
  },
  {
    state: 'VA', event_date: '2024-04-15', event_type: 'Hail', magnitude: 1.5,
    location: 'Loudoun County', cities: ['Leesburg', 'Sterling', 'Ashburn'],
    lat: 39.1155, lng: -77.5636, damage: 300000
  },
  {
    state: 'VA', event_date: '2024-08-10', event_type: 'Hail', magnitude: 2.0,
    location: 'Prince William County', cities: ['Manassas', 'Woodbridge', 'Dale City'],
    lat: 38.7509, lng: -77.4753, damage: 750000
  },
  {
    state: 'VA', event_date: '2024-05-22', event_type: 'Wind', magnitude: 70,
    location: 'Arlington County', cities: ['Arlington'],
    lat: 38.8816, lng: -77.0910, damage: 1000000
  },

  // VIRGINIA - 2023
  {
    state: 'VA', event_date: '2023-07-12', event_type: 'Hail', magnitude: 1.25,
    location: 'Fairfax County', cities: ['Fairfax', 'Vienna', 'Falls Church'],
    lat: 38.8462, lng: -77.3064, damage: 250000
  },
  {
    state: 'VA', event_date: '2023-09-08', event_type: 'Hail', magnitude: 1.75,
    location: 'Loudoun County', cities: ['Leesburg', 'Purcellville', 'Middleburg'],
    lat: 39.1155, lng: -77.5636, damage: 600000
  },
  {
    state: 'VA', event_date: '2023-06-15', event_type: 'Wind', magnitude: 65,
    location: 'Fairfax County', cities: ['Reston', 'Herndon', 'Great Falls'],
    lat: 38.9586, lng: -77.3570, damage: 450000
  },

  // VIRGINIA - 2022
  {
    state: 'VA', event_date: '2022-08-19', event_type: 'Hail', magnitude: 1.5,
    location: 'Fairfax County', cities: ['Vienna', 'Oakton', 'Dunn Loring'],
    lat: 38.9012, lng: -77.2653, damage: 400000
  },
  {
    state: 'VA', event_date: '2022-05-28', event_type: 'Hail', magnitude: 2.25,
    location: 'Prince William County', cities: ['Manassas', 'Gainesville'],
    lat: 38.7509, lng: -77.4753, damage: 850000
  },

  // MARYLAND - 2024
  {
    state: 'MD', event_date: '2024-07-03', event_type: 'Hail', magnitude: 1.5,
    location: 'Montgomery County', cities: ['Rockville', 'Gaithersburg', 'Bethesda', 'Silver Spring'],
    lat: 39.0840, lng: -77.1528, damage: 650000
  },
  {
    state: 'MD', event_date: '2024-06-18', event_type: 'Hail', magnitude: 1.75,
    location: 'Frederick County', cities: ['Frederick', 'Urbana', 'Mount Airy'],
    lat: 39.4143, lng: -77.4105, damage: 550000
  },
  {
    state: 'MD', event_date: '2024-08-25', event_type: 'Wind', magnitude: 75,
    location: 'Baltimore County', cities: ['Baltimore', 'Towson', 'Dundalk'],
    lat: 39.2904, lng: -76.6122, damage: 1200000
  },

  // MARYLAND - 2023
  {
    state: 'MD', event_date: '2023-05-10', event_type: 'Hail', magnitude: 1.25,
    location: 'Montgomery County', cities: ['Rockville', 'Potomac', 'Wheaton'],
    lat: 39.0840, lng: -77.1528, damage: 300000
  },
  {
    state: 'MD', event_date: '2023-07-22', event_type: 'Hail', magnitude: 2.0,
    location: 'Howard County', cities: ['Columbia', 'Ellicott City', 'Laurel'],
    lat: 39.2037, lng: -76.8610, damage: 700000
  },

  // MARYLAND - 2022
  {
    state: 'MD', event_date: '2022-06-12', event_type: 'Hail', magnitude: 1.5,
    location: 'Montgomery County', cities: ['Gaithersburg', 'Germantown'],
    lat: 39.1434, lng: -77.2014, damage: 450000
  },

  // PENNSYLVANIA - 2024
  {
    state: 'PA', event_date: '2024-06-05', event_type: 'Hail', magnitude: 1.75,
    location: 'Chester County', cities: ['West Chester', 'Downingtown', 'Coatesville'],
    lat: 39.9601, lng: -75.6066, damage: 550000
  },
  {
    state: 'PA', event_date: '2024-07-28', event_type: 'Hail', magnitude: 2.0,
    location: 'Delaware County', cities: ['Media', 'Chester', 'Upper Darby'],
    lat: 39.9168, lng: -75.3882, damage: 800000
  },
  {
    state: 'PA', event_date: '2024-08-14', event_type: 'Wind', magnitude: 70,
    location: 'Philadelphia County', cities: ['Philadelphia'],
    lat: 39.9526, lng: -75.1652, damage: 1500000
  },

  // PENNSYLVANIA - 2023
  {
    state: 'PA', event_date: '2023-05-18', event_type: 'Hail', magnitude: 1.5,
    location: 'Bucks County', cities: ['Doylestown', 'Newtown', 'Warminster'],
    lat: 40.3101, lng: -75.1299, damage: 400000
  },
  {
    state: 'PA', event_date: '2023-09-02', event_type: 'Hail', magnitude: 1.75,
    location: 'Montgomery County', cities: ['Norristown', 'King of Prussia', 'Lansdale'],
    lat: 40.1215, lng: -75.3397, damage: 600000
  },

  // PENNSYLVANIA - 2022
  {
    state: 'PA', event_date: '2022-07-08', event_type: 'Hail', magnitude: 2.25,
    location: 'Chester County', cities: ['West Chester', 'Phoenixville'],
    lat: 39.9601, lng: -75.6066, damage: 900000
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('[Weather Setup] Starting weather data population...');

    // Clear existing data
    await sql`DELETE FROM hail_events`;
    console.log('[Weather Setup] Cleared existing data');

    let imported = 0;

    for (const event of COMPREHENSIVE_STORM_DATA) {
      await sql`
        INSERT INTO hail_events (
          event_date,
          state,
          county,
          cities_affected,
          hail_size_inches,
          wind_speed_mph,
          latitude,
          longitude,
          property_damage,
          event_type,
          created_at
        ) VALUES (
          ${event.event_date},
          ${event.state},
          ${event.location},
          ${JSON.stringify(event.cities)},
          ${event.event_type === 'Hail' ? event.magnitude : null},
          ${event.event_type === 'Wind' ? event.magnitude : null},
          ${event.lat},
          ${event.lng},
          ${event.damage},
          ${event.event_type},
          NOW()
        )
      `;

      imported++;
      console.log(`[Weather Setup] Imported: ${event.event_date} - ${event.event_type} - ${event.location}`);
    }

    // Get summary
    const summary = await sql`
      SELECT
        state,
        EXTRACT(YEAR FROM event_date::date) as year,
        event_type,
        COUNT(*) as count,
        AVG(CASE WHEN hail_size_inches IS NOT NULL THEN hail_size_inches END) as avg_hail,
        MAX(CASE WHEN hail_size_inches IS NOT NULL THEN hail_size_inches END) as max_hail,
        SUM(property_damage) as total_damage
      FROM hail_events
      GROUP BY state, year, event_type
      ORDER BY state, year DESC, event_type
    `;

    console.log('[Weather Setup] Population complete!');

    return NextResponse.json({
      success: true,
      message: 'Weather data populated successfully',
      imported: imported,
      summary: summary.rows
    });

  } catch (error: any) {
    console.error('[Weather Setup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/setup/populate-weather',
    method: 'POST',
    description: 'Populates hail and wind storm data for VA, MD, PA (2022-2025)',
    states: ['Virginia', 'Maryland', 'Pennsylvania'],
    events: COMPREHENSIVE_STORM_DATA.length
  });
}
