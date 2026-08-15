import { useEffect, useMemo, useState } from 'react';
import exifr from 'exifr';
import piexif from 'piexifjs';

const KODAK_EXIF = {
    make: 'DS GLOBAL',
    model: 'KODAK02',
    software: 'KODAK SMILE CAMERA v2.0.8',
    exifVersion: '0230',
    componentsConfiguration: '1 2 3 0',
    imageDescription: 'KODAK SMILE CAMERA',
    orientation: '1',
    yCbCrPositioning: '2',
    copyright: 'Copyright, C&A CO., LTD. (Photographer) - [None] (Editor)',
    iso: '50',
    imageWidth: '3680',
    imageHeight: '2760',
    exposureTime: '1/256',
    fNumber: '2.2',
    exposureProgram: '3',
    maxApertureValue: '2.8',
    meteringMode: '5',
    flash: '0',
    focalLength: '3.0',
    exposureMode: '0',
    whiteBalance: '0',
    flashpixVersion: '0100',
    colorSpace: '1',
};

const formatKodakFileName = (index) => `KODAK_${String(index).padStart(4, '0')}.JPG`;

const loadImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });

const renderPreviewUrl = async (sourceUrl, mode) => {
    const image = await loadImage(sourceUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 3680;
    canvas.height = 2760;

    if (mode === 'stretch') {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.95);
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = mode === 'fill'
        ? Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
        : Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);

    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    context.drawImage(image, x, y, drawWidth, drawHeight);

    return canvas.toDataURL('image/jpeg', 0.95);
};

function App() {
    const [imageSrc, setImageSrc] = useState('');
    const [previewSrc, setPreviewSrc] = useState('');
    const [previewMode, setPreviewMode] = useState('fit');
    const [originalFileName, setOriginalFileName] = useState('');
    const [nextFileNumber, setNextFileNumber] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        return () => {
            if (imageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [imageSrc]);

    useEffect(() => {
        if (!imageSrc) {
            setPreviewSrc('');
            return;
        }

        let active = true;

        const updatePreview = async () => {
            try {
                const preview = await renderPreviewUrl(imageSrc, previewMode);
                if (active) {
                    setPreviewSrc(preview);
                }
            } catch {
                if (active) {
                    setPreviewSrc(imageSrc);
                }
            }
        };

        updatePreview();

        return () => {
            active = false;
        };
    }, [imageSrc, previewMode]);

    const outputFileName = useMemo(() => formatKodakFileName(nextFileNumber), [nextFileNumber]);

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const nextUrl = URL.createObjectURL(file);
            setImageSrc((current) => {
                if (current.startsWith('blob:')) {
                    URL.revokeObjectURL(current);
                }
                return nextUrl;
            });

            setOriginalFileName(file.name);
        } catch (loadError) {
            setError('The image upload failed. Please try another file.');
        } finally {
            setIsLoading(false);
        }
    };

    const rebuildFile = async () => {
        if (!imageSrc) {
            setError('Upload an image before downloading a new version.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const image = await loadImage(imageSrc);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = 3680;
            canvas.height = 2760;

            if (previewMode === 'stretch') {
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
            } else {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);

                const scale = previewMode === 'fill'
                    ? Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
                    : Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);

                const drawWidth = image.naturalWidth * scale;
                const drawHeight = image.naturalHeight * scale;
                const x = (canvas.width - drawWidth) / 2;
                const y = (canvas.height - drawHeight) / 2;

                context.drawImage(image, x, y, drawWidth, drawHeight);
            }

            const baseDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const exifData = {
                '0th': {
                    256: 3680,
                    257: 2760,
                    270: KODAK_EXIF.imageDescription,
                    271: KODAK_EXIF.make,
                    272: KODAK_EXIF.model,
                    274: Number(KODAK_EXIF.orientation),
                    277: 1,
                    278: 1,
                    305: KODAK_EXIF.software,
                    306: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    315: KODAK_EXIF.make,
                    531: Number(KODAK_EXIF.yCbCrPositioning),
                    33432: KODAK_EXIF.copyright,
                },
                Exif: {
                    33434: KODAK_EXIF.exposureTime,
                    33437: KODAK_EXIF.fNumber,
                    34850: Number(KODAK_EXIF.exposureProgram),
                    34855: Number(KODAK_EXIF.iso),
                    36864: KODAK_EXIF.exifVersion,
                    37121: KODAK_EXIF.componentsConfiguration,
                    37378: Number(KODAK_EXIF.maxApertureValue),
                    37383: Number(KODAK_EXIF.meteringMode),
                    37385: Number(KODAK_EXIF.flash),
                    37386: Number(KODAK_EXIF.focalLength),
                    40960: KODAK_EXIF.flashpixVersion,
                    40961: Number(KODAK_EXIF.colorSpace),
                    40962: 3680,
                    40963: 2760,
                    41986: Number(KODAK_EXIF.whiteBalance),
                },
                GPS: {},
                Interop: {},
                '1st': {},
            };

            const updatedUrl = piexif.insert(piexif.dump(exifData), baseDataUrl);
            const response = await fetch(updatedUrl);
            const blob = await response.blob();

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.href = url;
            link.download = outputFileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setNextFileNumber((current) => current + 1);
        } catch (downloadError) {
            setError('Something went wrong while writing the Kodak EXIF data. Please try another file.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-shell">
            <header className="topbar">
                <div>
                    <p className="eyebrow">SmileMore</p>
                    <h1>kodak smile exif spoofer</h1>
                </div>
            </header>

            <main className="layout">
                <section className="panel upload-panel">
                    <div className="panel-header">
                        <h2>1. Pick an image</h2>
                    </div>

                    <label className="upload-box" htmlFor="image-input">
                        <span>Choose image</span>
                        <input id="image-input" type="file" accept="image/*" onChange={handleFileChange} />
                    </label>

                    <div className="meta-summary">
                        <p>
                            <strong>Original file:</strong> {originalFileName || 'No file selected'}
                        </p>
                        <div className="field-row">
                            <span>Output name</span>
                            <div className="output-pill">{outputFileName}</div>
                        </div>

                        <div className="warning-box">
                            <p>In order for your Kodak Smile to print an outside photo, it must be named <b>KODAK_####.JPG</b>, with a number between 0001 and 9999. </p>
                            <br />
                            <p> If you don't follow the <b>KODAK_####.JPG</b> naming scheme, the camera will <b>not</b> allow the photo to be viewed or printed on the camera. <b>It may even be delete the photo from the SD card.</b> </p>
                        </div>

                    </div>


                </section>

                <section className="panel editor-panel">
                    <div className="panel-header">
                        <h2>2. Kodak preset</h2>
                    </div>

                    <div className="field-row">
                        <span>Cropping mode</span>
                        <div className="mode-toggle" aria-label="Preview mode">
                            <button
                                type="button"
                                className={previewMode === 'fit' ? 'mode-button active' : 'mode-button'}
                                onClick={() => setPreviewMode('fit')}
                            >
                                Fit
                            </button>
                            <button
                                type="button"
                                className={previewMode === 'fill' ? 'mode-button active' : 'mode-button'}
                                onClick={() => setPreviewMode('fill')}
                            >
                                Fill
                            </button>
                            <button
                                type="button"
                                className={previewMode === 'stretch' ? 'mode-button active' : 'mode-button'}
                                onClick={() => setPreviewMode('stretch')}
                            >
                                Stretch
                            </button>
                        </div>
                    </div>
                    {imageSrc ? (
                        <div className="preview-wrap">
                            <img src={previewSrc || imageSrc} alt="Selected upload preview" />
                        </div>
                    ) : null}
                    {error ? <p className="error-message">{error}</p> : null}

                    <button className="download-button" type="button" onClick={rebuildFile} disabled={isLoading || !imageSrc}>
                        {isLoading ? 'Preparing Kodak EXIF...' : 'Apply Kodak EXIF & download'}
                    </button>
                </section>
            </main>
        </div>
    );
}

export default App;
