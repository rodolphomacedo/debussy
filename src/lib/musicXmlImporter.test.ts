import { importMusicXml } from './musicXmlImporter'

const MINIMAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Test Piece</work-title></work>
  <identification>
    <creator type="composer">J.S. Bach</creator>
  </identification>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
      <note>
        <pitch><step>C</step><octave>2</octave></pitch>
        <duration>4</duration><type>whole</type><staff>2</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

const ACCIDENTALS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time><beats>3</beats><beat-type>8</beat-type></time>
      </attributes>
      <note>
        <pitch><step>D</step><alter>1</alter><octave>5</octave></pitch>
        <duration>1</duration><type>eighth</type><staff>1</staff>
      </note>
      <note>
        <pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch>
        <duration>1</duration><type>eighth</type><staff>1</staff>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration><type>eighth</type><staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

const CHORD_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
      <note>
        <chord/>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
      <note>
        <chord/>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration><type>quarter</type><staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

const REST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <rest/>
        <duration>4</duration><type>whole</type><staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

const DOTTED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <time><beats>3</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>6</duration><type>quarter</type><dot/><staff>1</staff>
      </note>
    </measure>
  </part>
</score-partwise>`

describe('importMusicXml', () => {
  it('parses title and composer', () => {
    const score = importMusicXml(MINIMAL_XML)
    expect(score.title).toBe('Test Piece')
    expect(score.composer).toBe('J.S. Bach')
  })

  it('parses time signature 4/4', () => {
    const score = importMusicXml(MINIMAL_XML)
    expect(score.timeSignature).toBe('4/4')
    expect(score.numBeats).toBe(4)
    expect(score.beatValue).toBe(4)
  })

  it('parses treble notes (staff 1)', () => {
    const score = importMusicXml(MINIMAL_XML)
    expect(score.measures[0].treble).toHaveLength(4)
    expect(score.measures[0].treble[0]).toEqual({ keys: ['c/4'], duration: 'q' })
    expect(score.measures[0].treble[3]).toEqual({ keys: ['c/5'], duration: 'q' })
  })

  it('parses bass notes (staff 2)', () => {
    const score = importMusicXml(MINIMAL_XML)
    expect(score.measures[0].bass).toHaveLength(1)
    expect(score.measures[0].bass[0]).toEqual({ keys: ['c/2'], duration: 'w' })
  })

  it('parses sharps and flats', () => {
    const score = importMusicXml(ACCIDENTALS_XML)
    const treble = score.measures[0].treble
    expect(treble[0]).toEqual({ keys: ['d#/5'], duration: '8' })
    expect(treble[1]).toEqual({ keys: ['bb/4'], duration: '8' })
    expect(treble[2]).toEqual({ keys: ['e/5'], duration: '8' })
  })

  it('parses 3/8 time signature', () => {
    const score = importMusicXml(ACCIDENTALS_XML)
    expect(score.timeSignature).toBe('3/8')
    expect(score.numBeats).toBe(3)
    expect(score.beatValue).toBe(8)
  })

  it('parses chords', () => {
    const score = importMusicXml(CHORD_XML)
    const firstNote = score.measures[0].treble[0]
    expect(firstNote.keys).toEqual(['c/4', 'e/4', 'g/4'])
    expect(firstNote.duration).toBe('q')
  })

  it('parses rests', () => {
    const score = importMusicXml(REST_XML)
    const restNote = score.measures[0].treble[0]
    expect(restNote.duration).toBe('wr')
    expect(restNote.keys[0]).toBe('b/4')
  })

  it('parses dotted notes', () => {
    const score = importMusicXml(DOTTED_XML)
    expect(score.measures[0].treble[0].duration).toBe('qd')
  })

  it('defaults title to Untitled when missing', () => {
    const xml = MINIMAL_XML.replace('<work-title>Test Piece</work-title>', '')
    const score = importMusicXml(xml)
    expect(score.title).toBe('Untitled')
  })

  it('throws on invalid XML', () => {
    expect(() => importMusicXml('not xml at all <broken')).toThrow()
  })

  it('throws on XML with no parts', () => {
    const xml = `<?xml version="1.0"?>
    <score-partwise><part-list></part-list></score-partwise>`
    expect(() => importMusicXml(xml)).toThrow()
  })
})
