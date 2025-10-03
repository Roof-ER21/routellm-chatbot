import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, date, latitude, longitude, radius = 25 } = body;

    if (!address || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Implement NOAA API integration
    // For now, return mock data
    const mockEvents = [
      {
        date: date,
        location: address,
        hailSize: '1.5 inches',
        windSpeed: '60 mph',
        severity: 'Moderate',
        distance: 5.2,
      },
      {
        date: date,
        location: 'Nearby location',
        hailSize: '1.0 inches',
        windSpeed: '45 mph',
        severity: 'Minor',
        distance: 12.8,
      },
    ];

    return NextResponse.json({
      success: true,
      events: mockEvents,
      dateRange: `${date} ± 7 days`,
      location: address,
      searchRadius: radius,
      message: `Found ${mockEvents.length} storm events`,
    });
  } catch (error: any) {
    console.error('Storm verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
