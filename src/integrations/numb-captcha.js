/**
 * Math captcha: add `<input name="numb_captcha">` to the form and submito turns it into
 * "3 + 7 = ?" (placeholder) with hidden `num1` / `num2` inputs. A weak bot deterrent only:
 * the operands are in the DOM. A new question is generated whenever the form resets.
 */

const FIELD = 'numb_captcha';

const randomOperand = () => Math.ceil(Math.random() * 10);

export default function numbCaptcha({ form }) {
  const field = form.querySelector(`input[name="${FIELD}"]`);
  if (!field) return null;

  const num1 = hiddenInput(form, 'num1');
  const num2 = hiddenInput(form, 'num2');
  if (!field.hasAttribute('autocomplete')) field.autocomplete = 'off';
  if (!field.hasAttribute('inputmode')) field.inputMode = 'numeric';

  const generate = () => {
    num1.value = String(randomOperand());
    num2.value = String(randomOperand());
    field.placeholder = `${num1.value} + ${num2.value} = ?`;
  };
  generate();

  return {
    rule(el) {
      if (el !== field) return null;
      const answer = el.value.trim();
      const correct = answer !== '' && Number(answer) === Number(num1.value) + Number(num2.value);
      return correct ? null : { key: 'captcha' };
    },
    reset: generate,
  };
}

function hiddenInput(form, name) {
  let input = form.querySelector(`input[name="${name}"]`);
  if (!input) {
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    form.append(input);
  }
  return input;
}
