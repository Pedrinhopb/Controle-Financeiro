import { registerSW } from './pwa/register';
import { configureAuthPersistence } from './integrations/firebase';

registerSW();
configureAuthPersistence().catch((error) => {
	console.error('Não foi possível configurar a persistência da autenticação.', error);
});
