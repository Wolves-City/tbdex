import { TBDexMessage, RequestForQuote, Quote } from "./TBDexProtocol";


// Define a CSV lookup table of payment, product, rate, paymentType, and credentialsRequired
const QUOTE_LOOKUP_TABLE = `
AUD,USD,1.3,creditCard,driversLicense
AUD,USD,1.4,wireTransfer,driversLicense
AUD,USD,1.41,wireTransfer,passport
AUD,Cheese,2,creditCard,none
AUD,Cheese,1,creditCard,driversLicense
`;

// Parse the CSV lookup table into an array of objects
const QUOTES = QUOTE_LOOKUP_TABLE.trim().split('\n').map(line => {
  const [payment, product, rate, paymentType, credentialsRequired] = line.split(',');
  return {
    payment,
    product,
    rate: parseFloat(rate),
    paymentType,
    credentialsRequired,
  };
});

export function makeBid(message: TBDexMessage): Quote[] {
  // Extract the RequestForQuote from the TBDexMessage body
  const rfq = message.body as RequestForQuote;

  // Filter the QUOTES array based on the RFQ criteria
  const filteredQuotes = QUOTES.filter(q => q.payment === rfq.have && q.product === rfq.want);

  // Create a Quote object for each matching quote
  const quotes = filteredQuotes.map(q => {
    let offerSize = 0, costSize = 0;

    if (rfq.side === 'have') {
      offerSize = rfq.size;
      costSize = rfq.size / q.rate;
    } else if (rfq.side === 'want') {
      offerSize = rfq.size / q.rate;
      costSize = rfq.size;
    }

    const quote: Quote = {
      quoteId: Math.random().toString(36).substr(2, 9),
      requestForQuoteId: message.id,
      offerUnit: q.product,
      offerSize,
      costUnit: q.payment,
      costSize,
      paymentType: { type: q.paymentType },
      presentationDefinitionRequest: { credentials: q.credentialsRequired === 'none' ? [] : [{ type: q.credentialsRequired }] },
    };

    return quote;
  });

  return quotes;
}
