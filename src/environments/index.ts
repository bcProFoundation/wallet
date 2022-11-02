
import { CurrencyProvider } from "src/app/providers/currency/currency";
/**
 * Environment: 'development'
 */
export const env = { 
    name: 'development', 
    enableAnimations: true,
    ratesAPI: new CurrencyProvider().getRatesApi(),
    activateScanner: true,
    awsUrl: 'http://localhost:3232/bws/api',
    lixiLotusUrl: 'https://dev.lixilotus.com/api' ,
    buildSwapALone: false,
    buildAdmin: true
};
    export default env;