// utils/embeddings.js
//
// This module centralizes helper functions for working with
// vector embeddings. It provides a function to call the OpenAI
// embedding API and a helper to compute cosine similarity between
// two numeric arrays. OpenAI keys are read from the Expo config
// (see app.config.js) so you can provide your own key at runtime.

import Constants from 'expo-constants';

// Attempt to read an OpenAI API key from the extra config. You can
// set OPENAI_API_KEY in app.config.js under expo.extra. When no key
// is provided the API call will short‑circuit and return null.
const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';

/**
 * Generate a vector embedding for the provided text. This uses the
 * OpenAI `/v1/embeddings` endpoint with the `text-embedding-ada-002`
 * model. When a key is not configured or the request fails the
 * function resolves to null.
 *
 * @param {string} text The text to embed
 * @returns {Promise<number[]|null>} A numeric array representing the
 *          embedding or null on failure
 */
export async function generateEmbedding(text) {
  // Guard against missing key or empty input
  if (!OPENAI_API_KEY || !text) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });
    const data = await res.json();
    // The API returns an array of embeddings; we take the first one.
    if (Array.isArray(data?.data) && data.data.length > 0) {
      return data.data[0].embedding;
    }
  } catch (e) {
    // Swallow errors – caller can decide how to handle a null value
    console.warn('Error generating embedding:', e.message);
  }
  return null;
}

/**
 * Compute the cosine similarity between two vectors. If either
 * vector is null or the lengths differ the function returns 0. Cosine
 * similarity measures the angle between two vectors and ranges from
 * -1 (opposite) to 1 (identical). A higher value indicates more
 * similarity.
 *
 * @param {number[]} a First vector
 * @param {number[]} b Second vector
 * @returns {number} Cosine similarity score
 */
export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}