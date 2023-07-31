const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

class PageGenerator {
    constructor(pagesData) {
        this.pagesData = pagesData;
    }

    fetchComponent(name) {
        try {
            const ejsFilePath = path.join(__dirname, '..', 'src', `components/${name}.ejs`);
            return fs.readFileSync(ejsFilePath, 'utf8');
        } catch (error) {
            console.error(`Error reading the ${name}.ejs component file:`, error);
            return ''; // Return an empty string as a fallback or handle the error as needed.
        }
    }

    generateTopNavigation() {
        const navigationItems = this.pagesData
            .filter((pageData) => pageData.pageName !== '404')
            .map((pageData) => `<li><a href="${pageData.pageName === 'home' ? '/' : `/${pageData.pageName}`}">${pageData.pageName}</a></li>`)
            .join('');

        const topNavigation = `
            <nav>
                <ul>
                    ${navigationItems}
                </ul>
            </nav>
        `;

        return topNavigation;
    }



    renderAndSavePage(pageData, routingGenerationCallback) {
        // Read the EJS template from the file system
        const templatePath = path.join(__dirname, '..', 'src', `${pageData.template}.ejs`);
        const stylesPath = path.join(__dirname, '..', 'src', 'styles.ejs');

        fs.readFile(templatePath, 'utf8', (err, template) => {
            if (err) {
                console.error(`Error reading the ${pageData.template}.ejs template:`, err);
            } else {
                // Generate the top navigation
                const topNav = this.generateTopNavigation();

                // Read the styles.ejs file
                fs.readFile(stylesPath, 'utf8', (err, styles) => {
                    if (err) {
                        console.error('Error reading styles.ejs:', err);
                    } else {
                        // Generate dynamic content

                        const dynamicContent = pageData.dynamicContent ? this.fetchComponent(pageData.dynamicContent) : '';

                        // Render the EJS template with data, top navigation, styles, and dynamic content
                        const renderedHtml = ejs.render(template, {
                            pageName: pageData.pageName,
                            dynamicContent: dynamicContent,
                            topNav: topNav,
                            styles: styles, // Pass the styles as a variable
                        });

                        const outputPath = path.join(__dirname, '..', 'public', `${pageData.fileName}.html`);
                        fs.writeFile(outputPath, renderedHtml, 'utf8', (err) => {
                            if (err) {
                                console.error(`Error saving ${pageData.pageName}.html:`, err);
                            } else {
                                console.log(`${pageData.pageName}.html saved successfully.`);

                                // Check if this is the last pageData, then generate the Firebase config
                                if (pageData === this.pagesData[this.pagesData.length - 1]) {
                                    // Execute the routingGenerationCallback function
                                    routingGenerationCallback();
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    generatePages() {
        // Loop through the pages data and render/save each page
        this.pagesData.forEach((pageData) => {
            this.renderAndSavePage(pageData, FirebaseHelpers.generateFirebaseConfig);
        });
    }
}


class FirebaseHelpers {

    static generateFirebaseConfig() {
        const publicDirPath = path.join(__dirname, '..', 'public');

        // Read the files in the public directory
        const files = fs.readdirSync(publicDirPath);

        // Define the default and wildcard rewrites
        const rewrites = [
            { source: '/', destination: 'index.html' },
            { source: '**', destination: '404.html' },
        ];

        // Map the files to their corresponding routes and add to the rewrites
        files.forEach((file) => {
            const fileName = path.basename(file, path.extname(file));
            if (fileName !== 'index' && fileName !== '404') {
                rewrites.push({ source: `/${fileName}`, destination: `/${file}` });
            }
        });

        // Sort the rewrites array to ensure that the 404 rule is last
        rewrites.sort((a, b) => {
            if (a.source === '**') return 1; // 404 rule comes last
            if (b.source === '**') return -1;
            return 0;
        });

        // Create the Firebase Hosting config object
        const firebaseConfig = {
            hosting: {
                public: 'public',
                rewrites: rewrites,
            },
        };

        // Convert the config object to JSON string
        const jsonString = JSON.stringify(firebaseConfig, null, 2);

        // Save the JSON string to firebase.json
        fs.writeFileSync(path.join(__dirname, '..', 'firebase.json'), jsonString);

        console.log('firebase.json created successfully.');
    }

}

class DataHelpers {

    static readSiteData() {
        const siteDataFilePath = path.join(__dirname, '..', 'siteData.json');
        const siteDataContent = fs.readFileSync(siteDataFilePath, 'utf8');
        return JSON.parse(siteDataContent).pagesData;
    }

}



//const siteData = DataHelpers.readSiteData();
//const pagesData = siteData.pagesData;

const pageGenerator = new PageGenerator(DataHelpers.readSiteData());
pageGenerator.generatePages();
