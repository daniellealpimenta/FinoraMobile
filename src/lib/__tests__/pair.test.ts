import { parsePairLink } from '../pair';

describe('link do QR de pareamento', () => {
  it('lê o endereço e o código', () => {
    expect(parsePairLink('finora://parear?url=http%3A%2F%2F100.64.1.2%3A8765&code=123456')).toEqual({
      url: 'http://100.64.1.2:8765',
      code: '123456',
    });
  });

  it('recusa QR de outra coisa ou código inválido', () => {
    expect(parsePairLink('https://exemplo.com')).toBeNull();
    expect(parsePairLink('finora://parear?url=http%3A%2F%2Fx&code=12')).toBeNull();
    expect(parsePairLink('finora://parear?code=123456')).toBeNull();
  });
});
