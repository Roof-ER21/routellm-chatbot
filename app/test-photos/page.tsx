'use client'

import { useState } from 'react'
import MessageWithPhotos from '../components/MessageWithPhotos'

/**
 * Test page for Photo Reference System
 *
 * This page allows testing of inline photo references without needing
 * to interact with the full chat system.
 *
 * Access at: /test-photos
 */
export default function TestPhotosPage() {
  const [customText, setCustomText] = useState('')

  // Predefined test examples
  const examples = [
    {
      title: 'Basic Drip Edge',
      text: 'Drip edge [PHOTO:drip edge:1] [PHOTO:drip edge:2] is installed along the eaves and rakes of your roof. It prevents water from seeping under the shingles and protects the fascia.'
    },
    {
      title: 'Step Flashing Installation',
      text: 'Step flashing [PHOTO:step flashing:1] is used along sidewalls and chimneys. Each piece [PHOTO:step flashing:2] overlaps the one below it to create a watertight seal.'
    },
    {
      title: 'Multiple Components',
      text: 'Proper roof edge details include drip edge [PHOTO:drip edge:1], ice and water shield [PHOTO:ice and water shield:1], and proper gutter installation [PHOTO:gutter:1]. The overhang [PHOTO:overhang:1] provides ventilation.'
    },
    {
      title: 'Hail Damage Examples',
      text: 'Common hail damage patterns [PHOTO:shingle damage:1] [PHOTO:shingle damage:2] include bruising, granule loss, and cracking. Test squares [PHOTO:test square:1] help document damage density.'
    },
    {
      title: 'Chimney Flashing System',
      text: 'A complete chimney [PHOTO:chimney:1] flashing system includes step flashing [PHOTO:step flashing:1], counter flashing [PHOTO:counter flashing:1], and proper apron flashing at the base.'
    },
    {
      title: 'Ventilation Systems',
      text: 'Ridge vents [PHOTO:ridge vent:1] [PHOTO:ridge vent:2] provide exhaust ventilation while exhaust caps [PHOTO:exhaust cap:1] handle individual penetrations. Proper ventilation prevents ice dams.'
    },
    {
      title: 'Valley Installation',
      text: 'Roof valleys [PHOTO:valley:1] [PHOTO:valley:2] are critical water channels. All valleys should have ice and water shield [PHOTO:ice and water shield:1] underneath for protection.'
    },
    {
      title: 'Skylight Details',
      text: 'Skylights [PHOTO:skylight:1] require proper flashing [PHOTO:skylight:2] to prevent leaks. Step flashing [PHOTO:step flashing:1] along the sides is essential.'
    },
    {
      title: 'Invalid Reference Test',
      text: 'This text has a missing photo [PHOTO:nonexistent:1] which should render invisibly without breaking the layout. The rest of the text should flow normally.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Photo Reference System Test
          </h1>
          <p className="text-gray-600">
            Interactive testing environment for inline photo references
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            How to Use
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Hover</strong> over thumbnails to see preview (desktop only)</li>
            <li>• <strong>Click</strong> thumbnails to navigate to Knowledge Base</li>
            <li>• <strong>Try custom text</strong> with [PHOTO:term:N] syntax below</li>
            <li>• <strong>Examples:</strong> [PHOTO:drip edge:1] or [PHOTO:step flashing:2]</li>
          </ul>
        </div>

        {/* Custom Text Input */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test Custom Text
          </h2>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter text with [PHOTO:term:N] syntax, e.g.: Drip edge [PHOTO:drip edge:1] is important."
            className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
          />

          {customText && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2 font-semibold">RENDERED OUTPUT:</p>
              <MessageWithPhotos text={customText} />
            </div>
          )}
        </div>

        {/* Predefined Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Predefined Examples
          </h2>

          {examples.map((example, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📸</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {example.title}
                </h3>
              </div>

              {/* Raw Text */}
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-1">RAW TEXT:</p>
                <p className="text-xs text-gray-600 font-mono">
                  {example.text}
                </p>
              </div>

              {/* Rendered Output */}
              <div className="p-4 bg-white rounded border-2 border-blue-200">
                <p className="text-xs text-gray-500 font-semibold mb-2">RENDERED OUTPUT:</p>
                <MessageWithPhotos text={example.text} />
              </div>
            </div>
          ))}
        </div>

        {/* Supported Terms Reference */}
        <div className="mt-8 bg-white rounded-lg border-2 border-gray-200 p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Supported Terms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'drip edge',
              'step flashing',
              'chimney',
              'chimney flashing',
              'counter flashing',
              'apron flashing',
              'skylight',
              'skylight flashing',
              'ridge vent',
              'valley',
              'exhaust cap',
              'shingle damage',
              'test square',
              'ice and water shield',
              'overhang',
              'gutter',
              'metals',
              'interior',
              'slope',
              'elevation'
            ].map((term) => (
              <div
                key={term}
                className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700"
              >
                <code className="text-xs text-blue-600">[PHOTO:{term}:1]</code>
              </div>
            ))}
          </div>
        </div>

        {/* Syntax Reference */}
        <div className="mt-8 bg-gray-900 text-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">
            Syntax Reference
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Basic syntax:</p>
              <code className="block bg-gray-800 px-3 py-2 rounded">
                [PHOTO:term:N]
              </code>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Where:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li><strong>term</strong> - The roofing term (e.g., "drip edge")</li>
                <li><strong>N</strong> - Photo index (1 or 2)</li>
              </ul>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Examples:</p>
              <code className="block bg-gray-800 px-3 py-2 rounded mb-1">
                [PHOTO:drip edge:1]
              </code>
              <code className="block bg-gray-800 px-3 py-2 rounded mb-1">
                [PHOTO:step flashing:2]
              </code>
              <code className="block bg-gray-800 px-3 py-2 rounded">
                [PHOTO:chimney flashing:1]
              </code>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to Susan AI-21
          </a>
        </div>
      </div>
    </div>
  )
}
