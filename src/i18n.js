/**
 * Built-in dictionaries (en, sr, bg, de, es, fr), picked by the closest `lang` attribute
 * (form → `<html>`). Regional codes fall back to the base language (`de-AT` → `de`,
 * `sr-Latn` → `sr`); unknown languages fall back to `en`.
 * Per-form overrides come from the `messages` option.
 */
export const STRINGS = {
  en: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    url: 'Please enter a valid URL.',
    number: 'Please enter a valid number.',
    minlength: 'Please enter at least {min} characters.',
    maxlength: 'Please enter no more than {max} characters.',
    min: 'Please enter a value of {min} or more.',
    max: 'Please enter a value of {max} or less.',
    pattern: 'Please match the requested format.',
    invalid: 'Please enter a valid value.',
    phone: 'Please enter a valid phone number.',
    captcha: 'Incorrect answer. Please try again.',
    captcha_required: 'Please complete the security check.',
    captcha_error: 'The security check could not be completed. Please try again.',
    success_title: 'Thank you!',
    success: 'Your submission has been received.',
    error_title: 'Something went wrong',
    error: 'We could not process your request. Please try again.',
    network: 'Network error. Check your connection and try again.',
    ok: 'OK',
  },
  sr: {
    required: 'Ovo polje je obavezno.',
    email: 'Unesite ispravnu email adresu.',
    url: 'Unesite ispravan URL.',
    number: 'Unesite ispravan broj.',
    minlength: 'Unesite najmanje {min} karaktera.',
    maxlength: 'Unesite najviše {max} karaktera.',
    min: 'Unesite vrednost {min} ili veću.',
    max: 'Unesite vrednost {max} ili manju.',
    pattern: 'Unesite vrednost u traženom formatu.',
    invalid: 'Unesite ispravnu vrednost.',
    phone: 'Unesite ispravan broj telefona.',
    captcha: 'Netačan odgovor. Pokušajte ponovo.',
    captcha_required: 'Završite sigurnosnu proveru.',
    captcha_error: 'Sigurnosna provera nije uspela. Pokušajte ponovo.',
    success_title: 'Hvala!',
    success: 'Vaš zahtev je uspešno poslat.',
    error_title: 'Došlo je do greške',
    error: 'Nismo uspeli da obradimo zahtev. Pokušajte ponovo.',
    network: 'Greška na mreži. Proverite vezu i pokušajte ponovo.',
    ok: 'U redu',
  },
  bg: {
    required: 'Това поле е задължително.',
    email: 'Моля, въведете валиден имейл адрес.',
    url: 'Моля, въведете валиден URL адрес.',
    number: 'Моля, въведете валидно число.',
    minlength: 'Моля, въведете поне {min} знака.',
    maxlength: 'Моля, въведете не повече от {max} знака.',
    min: 'Моля, въведете стойност не по-малка от {min}.',
    max: 'Моля, въведете стойност не по-голяма от {max}.',
    pattern: 'Моля, спазете изисквания формат.',
    invalid: 'Моля, въведете валидна стойност.',
    phone: 'Моля, въведете валиден телефонен номер.',
    captcha: 'Грешен отговор. Моля, опитайте отново.',
    captcha_required: 'Моля, завършете проверката за сигурност.',
    captcha_error: 'Проверката за сигурност не можа да бъде завършена. Моля, опитайте отново.',
    success_title: 'Благодарим ви!',
    success: 'Формулярът беше изпратен успешно.',
    error_title: 'Нещо се обърка',
    error: 'Не успяхме да обработим заявката ви. Моля, опитайте отново.',
    network: 'Грешка в мрежата. Проверете връзката си и опитайте отново.',
    ok: 'OK',
  },
  de: {
    required: 'Dieses Feld ist erforderlich.',
    email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    url: 'Bitte geben Sie eine gültige URL ein.',
    number: 'Bitte geben Sie eine gültige Zahl ein.',
    minlength: 'Bitte geben Sie mindestens {min} Zeichen ein.',
    maxlength: 'Bitte geben Sie höchstens {max} Zeichen ein.',
    min: 'Bitte geben Sie einen Wert von mindestens {min} ein.',
    max: 'Bitte geben Sie einen Wert von höchstens {max} ein.',
    pattern: 'Bitte halten Sie sich an das geforderte Format.',
    invalid: 'Bitte geben Sie einen gültigen Wert ein.',
    phone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
    captcha: 'Falsche Antwort. Bitte versuchen Sie es erneut.',
    captcha_required: 'Bitte schließen Sie die Sicherheitsprüfung ab.',
    captcha_error: 'Die Sicherheitsprüfung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.',
    success_title: 'Vielen Dank!',
    success: 'Ihre Angaben wurden erfolgreich übermittelt.',
    error_title: 'Etwas ist schiefgelaufen',
    error: 'Ihre Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
    network: 'Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    ok: 'OK',
  },
  es: {
    required: 'Este campo es obligatorio.',
    email: 'Introduzca una dirección de correo electrónico válida.',
    url: 'Introduzca una URL válida.',
    number: 'Introduzca un número válido.',
    minlength: 'Introduzca al menos {min} caracteres.',
    maxlength: 'Introduzca como máximo {max} caracteres.',
    min: 'Introduzca un valor igual o superior a {min}.',
    max: 'Introduzca un valor igual o inferior a {max}.',
    pattern: 'Respete el formato solicitado.',
    invalid: 'Introduzca un valor válido.',
    phone: 'Introduzca un número de teléfono válido.',
    captcha: 'Respuesta incorrecta. Inténtelo de nuevo.',
    captcha_required: 'Complete la verificación de seguridad.',
    captcha_error: 'No se pudo completar la verificación de seguridad. Inténtelo de nuevo.',
    success_title: '¡Gracias!',
    success: 'Su formulario se ha enviado correctamente.',
    error_title: 'Algo salió mal',
    error: 'No pudimos procesar su solicitud. Inténtelo de nuevo.',
    network: 'Error de red. Compruebe su conexión e inténtelo de nuevo.',
    ok: 'Aceptar',
  },
  fr: {
    required: 'Ce champ est obligatoire.',
    email: 'Veuillez saisir une adresse e-mail valide.',
    url: 'Veuillez saisir une URL valide.',
    number: 'Veuillez saisir un nombre valide.',
    minlength: 'Veuillez saisir au moins {min} caractères.',
    maxlength: 'Veuillez ne pas dépasser {max} caractères.',
    min: 'Veuillez saisir une valeur supérieure ou égale à {min}.',
    max: 'Veuillez saisir une valeur inférieure ou égale à {max}.',
    pattern: 'Veuillez respecter le format demandé.',
    invalid: 'Veuillez saisir une valeur valide.',
    phone: 'Veuillez saisir un numéro de téléphone valide.',
    captcha: 'Réponse incorrecte. Veuillez réessayer.',
    captcha_required: 'Veuillez effectuer la vérification de sécurité.',
    captcha_error: "La vérification de sécurité n'a pas pu aboutir. Veuillez réessayer.",
    success_title: 'Merci !', // French typography: non-breaking space before "!"
    success: 'Votre formulaire a bien été envoyé.',
    error_title: 'Une erreur est survenue',
    error: "Nous n'avons pas pu traiter votre demande. Veuillez réessayer.",
    network: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
    ok: 'OK',
  },
};

/** Language for a form: closest `lang` attribute, else `<html lang>`, else `en`. */
export function langOf(form) {
  return (form.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang || 'en').toLowerCase();
}

/**
 * @param {string} key
 * @param {Record<string, string|number>} [params] values for `{placeholders}`
 * @param {string} [lang]
 * @param {Record<string, string>} [overrides] the `messages` option
 */
export function translate(key, params, lang = 'en', overrides = null) {
  const base = lang.split('-')[0];
  const text = overrides?.[key] ?? STRINGS[lang]?.[key] ?? STRINGS[base]?.[key] ?? STRINGS.en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] ?? match).toString());
}
