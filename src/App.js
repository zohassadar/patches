import './App.css';
import { useState } from 'react';

const { saveAs, MarcFile, md5, parseBPSFile } = require('./bps.js');

function Information({ hide, information }) {
    if (hide) return;
    return (
        <>
            <p>{information}</p>
        </>
    );
}

function SaveFile({ hide, file, text }) {
    if (hide) return;
    function downloadRom() {
        saveAs(new Blob([file.contents._u8array]), file.filename);
    }
    return (
        <>
            <button onClick={downloadRom}>{text}</button>
        </>
    );
}

function NewFileInput({ name, handleInput, hide }) {
    if (hide) return;
    return (
        <>
            <input name={name} type="file" onInput={handleInput} />
        </>
    );
}

function FileInput({ name, handleInput, hide }) {
    if (hide) return;
    function handleFileLoad(fileEvent, filename) {
        console.log(`Read ${fileEvent.target.result.length} bytes`);
        const contents = fileEvent.target.result;
        const bytes = new Uint8Array(contents.length);
        for (let i = 0; i < contents.length; i++) {
            bytes[i] = contents[i].charCodeAt(0);
        }
        handleInput({ filename: filename, contents: bytes });
    }

    function _handleInput(event) {
        const filename = event.target.files[0].name;
        const reader = new FileReader();
        reader.readAsBinaryString(event.target.files[0]);
        reader.onload = (fileEvent) => handleFileLoad(fileEvent, filename);
    }
    return (
        <>
            <input name={name} type="file" onInput={_handleInput} />
        </>
    );
}

function App() {
    const [rom, setRom] = useState(null);
    const [patch, setPatch] = useState(null);
    const [patched, setPatched] = useState(null);

    const [romInfo, setRomInfo] = useState('');
    const [patchInfo, setPatchInfo] = useState('');
    function handleRomInput(romFile) {
        const romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
        function onMarcRomLoad() {
            setRom({
                filename: romFile.target.files[0].name,
                contents: romMarc,
            });
            const hash = md5(romMarc._u8array).toString();
            setRomInfo(hash);
        }
    }

    function handlePatchInput(patchFile) {
        const patchMarc = new MarcFile(
            patchFile.target.files[0],
            onMarcPatchLoad,
        );
        function onMarcPatchLoad() {
            setPatch({
                filename: patchFile.target.files[0].name,
                contents: patchMarc,
            });
            setPatchInfo(`${patchMarc._u8array.length} bytes`);
            try {
                const bpsPatch = parseBPSFile(patchMarc);
                const _patched = bpsPatch.apply(rom.contents, true);
                setPatched({
                    filename: 'patched.nes',
                    contents: _patched,
                    valid: true,
                });
            } catch {}
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <Information hide={false} information="give rom" />
                <NewFileInput name="RomInput" handleInput={handleRomInput} />
                <Information hide={!rom} information={romInfo} />
                <SaveFile
                    hide={!rom}
                    file={rom}
                    text="download unmodified rom"
                />
                <Information hide={!rom} information="give patch" />
                <NewFileInput
                    name="PatchInput"
                    handleInput={handlePatchInput}
                    hide={!rom}
                />
                <Information hide={!patch} information={patchInfo} />
                <SaveFile
                    hide={!patch}
                    file={patch}
                    text="download unmodified patch"
                />
                <SaveFile
                    hide={!rom || !patch || (patched && !patched.valid)}
                    file={patched}
                    text="download patched"
                />
            </header>
        </div>
    );
}

export default App;
