import { EvolutePage } from './app.po';

describe('evolute App', function() {
    let page: EvolutePage;

    beforeEach(() => {
        page = new EvolutePage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toEqual('app works!');
    });
});