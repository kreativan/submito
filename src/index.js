import { newForm } from './form.js';

/** submito public API */
const submito = {
  newForm,
};

/** attach submito to global scope */
if (typeof window !== 'undefined') {
  window.submito = submito;
}

export default submito;
