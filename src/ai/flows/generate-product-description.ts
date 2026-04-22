'use server';
/**
 * @fileOverview A Genkit flow for generating detailed product descriptions based on product attributes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
  sku: z.string().optional().describe('The SKU or barcode.'),
  costPrice: z.number().optional().describe('The cost price.'),
  salePrice: z.number().optional().describe('The sale price.'),
  existingDescription: z.string().optional().describe('Existing notes.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed and engaging product description in Portuguese.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `Você é um copywriter de elite para e-commerce.

Crie uma descrição persuasiva, técnica e envolvente em Português do Brasil para o produto:
Nome: {{{name}}}
Categoria: {{{category}}}
{{#if salePrice}}Valor: R$ {{{salePrice}}}{{/if}}
{{#if existingDescription}}Base: {{{existingDescription}}}{{/if}}

Destaque benefícios, use gatilhos mentais e mantenha um tom profissional. Evite introduções genéricas, vá direto ao ponto e convença o cliente da qualidade do item.`,
});

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  try {
    const {output} = await prompt(input);
    if (!output) throw new Error("A IA não retornou uma resposta válida.");
    return output;
  } catch (error) {
    console.error("Erro no fluxo de descrição:", error);
    throw error;
  }
}
