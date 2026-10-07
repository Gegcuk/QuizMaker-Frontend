import { describe, expect, it } from 'vitest';
import { getLoginReturnPath } from './loginReturn';

describe('login destination boundary', () => {
  it('keeps a relative quiz URL including its tab and fragment', () => {
    expect(getLoginReturnPath({ returnTo: '/quizzes/quiz-123?tab=questions#question-4' }))
      .toBe('/quizzes/quiz-123?tab=questions#question-4');
  });
  it.each([
    null, {}, { returnTo: 42 },
    { returnTo: 'https://evil.example/quizzes' },
    { returnTo: '//evil.example/quizzes' },
    { returnTo: '/\\evil.example' },
    { returnTo: '/path\nsecret' },
    { returnTo: '/path%0Dsecret' },
    { returnTo: '/path%7Fsecret' },
    { returnTo: `/path${String.fromCharCode(133)}secret` },
    { returnTo: '/%2F%2Fevil.example' },
    { returnTo: '/oauth2/redirect/?code=secret' },
    { returnTo: '/OAuth2/Redirect?code=secret' },
    { returnTo: '/LOGIN' },
    { returnTo: '/oauth/%63allback?again=true' },
    { returnTo: '/login?returnTo=/login' },
    { returnTo: '/register/' },
    { returnTo: '/bad%encoding' },
  ])('uses the ordinary default for invalid state %j', (state) => {
    expect(getLoginReturnPath(state)).toBe('/my-quizzes');
  });
});
